/** Phantom Response Language (PRL) v1 runtime primitives.
 * Provider-neutral semantic messages for the Phantom control plane.
 */

export const PRL_VERSION = '1';

export const PRL_STATES = [
  'PROPOSED','PLANNED','AUTHORIZED','ENGAGED','EXECUTING','WAITING',
  'CHALLENGED','TESTING','VERIFYING','PROVEN','DEPLOYING','DEPLOYED',
  'MEASURING','LEARNING','IMPROVING','COMPLETED','FAILED','BLOCKED','CANCELLED',
] as const;

export type PrlState = typeof PRL_STATES[number];
export type PrlKind = 'MISSION'|'PLAN'|'TASK'|'ACTION'|'RESULT'|'PROOF'|'EVENT'|'ERROR'|'HANDOFF';

export interface PrlMessage {
  version: string;
  kind: PrlKind;
  id: string;
  parent: string | null;
  actor: string;
  capability: string;
  state: PrlState;
  body: Record<string, unknown>;
  signature?: string;
}

export class PrlError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'PrlError';
    this.code = code;
  }
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 256) {
    throw new PrlError('INVALID_FIELD', `${field} must be a non-empty string <= 256 characters`);
  }
  return value;
}

export function validatePrl(input: unknown): PrlMessage {
  if (!input || typeof input !== 'object') throw new PrlError('INVALID_MESSAGE', 'PRL message must be an object');
  const m = input as Record<string, unknown>;
  const version = requireText(m.version, 'version');
  if (version !== PRL_VERSION) throw new PrlError('UNSUPPORTED_VERSION', `Unsupported PRL version: ${version}`);
  const kind = requireText(m.kind, 'kind') as PrlKind;
  const kinds: PrlKind[] = ['MISSION','PLAN','TASK','ACTION','RESULT','PROOF','EVENT','ERROR','HANDOFF'];
  if (!kinds.includes(kind)) throw new PrlError('INVALID_KIND', `Unsupported PRL kind: ${kind}`);
  const state = requireText(m.state, 'state') as PrlState;
  if (!(PRL_STATES as readonly string[]).includes(state)) throw new PrlError('INVALID_STATE', `Unsupported PRL state: ${state}`);
  if (m.parent !== null && typeof m.parent !== 'string') throw new PrlError('INVALID_PARENT', 'parent must be a string or null');
  if (!m.body || typeof m.body !== 'object' || Array.isArray(m.body)) throw new PrlError('INVALID_BODY', 'body must be an object');
  return {
    version,
    kind,
    id: requireText(m.id, 'id'),
    parent: m.parent as string | null,
    actor: requireText(m.actor, 'actor'),
    capability: requireText(m.capability, 'capability'),
    state,
    body: m.body as Record<string, unknown>,
    ...(typeof m.signature === 'string' ? { signature: m.signature } : {}),
  };
}

export function encodePrl(message: PrlMessage): string {
  const m = validatePrl(message);
  const lines = [
    `@PRL/${m.version}`,
    `KIND ${m.kind}`,
    `ID ${m.id}`,
    `PARENT ${m.parent ?? 'none'}`,
    `ACTOR ${m.actor}`,
    `CAP ${m.capability}`,
    `STATE ${m.state}`,
    `BODY ${JSON.stringify(m.body)}`,
    ...(m.signature ? [`SIG ${m.signature}`] : []),
    'END',
  ];
  return lines.join('\n');
}

export function decodePrl(text: string): PrlMessage {
  if (typeof text !== 'string' || !text.startsWith('@PRL/')) throw new PrlError('INVALID_FRAME', 'PRL frame header missing');
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) !== 'END') throw new PrlError('INVALID_FRAME', 'PRL frame must terminate with END');
  const fields: Record<string, string> = {};
  for (const line of lines.slice(1, -1)) {
    const index = line.indexOf(' ');
    if (index < 1) throw new PrlError('INVALID_FRAME', `Malformed PRL field: ${line}`);
    const key = line.slice(0, index);
    const value = line.slice(index + 1);
    if (fields[key] !== undefined) throw new PrlError('DUPLICATE_FIELD', `Duplicate PRL field: ${key}`);
    fields[key] = value;
  }
  const version = lines[0].slice('@PRL/'.length);
  let body: unknown;
  try { body = JSON.parse(fields.BODY ?? '{}'); } catch { throw new PrlError('INVALID_BODY', 'BODY must contain valid JSON'); }
  return validatePrl({ version, kind: fields.KIND, id: fields.ID, parent: fields.PARENT === 'none' ? null : fields.PARENT, actor: fields.ACTOR, capability: fields.CAP, state: fields.STATE, body, signature: fields.SIG });
}

export function makePrl(overrides: Partial<PrlMessage> & Pick<PrlMessage, 'kind'|'id'|'actor'|'capability'|'state'>): PrlMessage {
  return validatePrl({ version: PRL_VERSION, parent: null, body: {}, ...overrides });
}
