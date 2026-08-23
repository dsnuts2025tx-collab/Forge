/**
 * Phantom-controlled durable audit boundary for Mastermind.
 *
 * The store contract is intentionally provider-neutral. A production adapter can
 * map it to Phantom-owned storage without changing audit semantics. State is
 * validated before admission and before restoration so persisted audit history
 * is never trusted merely because it can be parsed.
 */

import type { MastermindAuditEvent, MastermindAuditSink } from './mastermind-audit';

export interface MastermindAuditSnapshot {
  version: '1';
  events: MastermindAuditEvent[];
}

export interface MastermindAuditStore {
  load(): MastermindAuditSnapshot | undefined;
  save(snapshot: MastermindAuditSnapshot): void;
}

function cloneEvent(event: MastermindAuditEvent): MastermindAuditEvent {
  return {
    ...event,
    evidence: JSON.parse(JSON.stringify(event.evidence)) as Record<string, unknown>,
  };
}

function assertEvent(event: MastermindAuditEvent): void {
  if (!event.id.trim()) throw new Error('Mastermind audit event id is required');
  if (!event.type) throw new Error('Mastermind audit event type is required');
  if (!event.occurredAt.trim() || Number.isNaN(Date.parse(event.occurredAt))) {
    throw new Error('Mastermind audit event timestamp is invalid');
  }
  if (!event.actor.trim()) throw new Error('Mastermind audit actor is required');
  if (!event.correlationId.trim()) throw new Error('Mastermind audit correlation id is required');
  if (!event.evidence || typeof event.evidence !== 'object') {
    throw new Error('Mastermind audit evidence is required');
  }
}

export function verifyMastermindAuditSnapshot(snapshot: MastermindAuditSnapshot): void {
  if (snapshot.version !== '1') throw new Error(`Unsupported Mastermind audit snapshot version: ${snapshot.version}`);

  const ids = new Set<string>();
  let previousTime = -Infinity;

  for (const event of snapshot.events) {
    assertEvent(event);
    if (ids.has(event.id)) throw new Error(`Duplicate Mastermind audit event id: ${event.id}`);
    ids.add(event.id);

    const occurredAt = Date.parse(event.occurredAt);
    if (occurredAt < previousTime) {
      throw new Error('Mastermind audit events are not chronologically ordered');
    }
    previousTime = occurredAt;
  }
}

/**
 * Phantom-controlled durable sink reference implementation.
 * The backing store is injected, so storage remains a replaceable boundary.
 */
export class PersistentMastermindAuditSink implements MastermindAuditSink {
  private events: MastermindAuditEvent[];

  constructor(private readonly store: MastermindAuditStore) {
    const snapshot = store.load();
    if (snapshot) verifyMastermindAuditSnapshot(snapshot);
    this.events = snapshot?.events.map(cloneEvent) ?? [];
  }

  append(event: MastermindAuditEvent): void {
    assertEvent(event);
    if (this.events.some((existing) => existing.id === event.id)) {
      throw new Error(`Duplicate Mastermind audit event id: ${event.id}`);
    }

    const next = [...this.events, cloneEvent(event)];
    verifyMastermindAuditSnapshot({ version: '1', events: next });
    this.store.save({ version: '1', events: next.map(cloneEvent) });
    this.events = next;
  }

  list(correlationId?: string): MastermindAuditEvent[] {
    return this.events
      .filter((event) => !correlationId || event.correlationId === correlationId)
      .map(cloneEvent);
  }

  reload(): void {
    const snapshot = this.store.load();
    if (snapshot) verifyMastermindAuditSnapshot(snapshot);
    this.events = snapshot?.events.map(cloneEvent) ?? [];
  }
}

/** Phantom-controlled reference persistence adapter for tests/local operation. */
export class InMemoryMastermindAuditStore implements MastermindAuditStore {
  private snapshot?: MastermindAuditSnapshot;

  load(): MastermindAuditSnapshot | undefined {
    return this.snapshot
      ? { version: '1', events: this.snapshot.events.map(cloneEvent) }
      : undefined;
  }

  save(snapshot: MastermindAuditSnapshot): void {
    verifyMastermindAuditSnapshot(snapshot);
    this.snapshot = {
      version: '1',
      events: snapshot.events.map(cloneEvent),
    };
  }
}
