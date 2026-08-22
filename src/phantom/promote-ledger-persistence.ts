/**
 * Phantom-owned persistence boundary for Promote audit/evidence ledgers.
 *
 * The control plane owns the record format and validation rules. A deployment
 * supplies the actual durable byte store (disk, database, object storage, or
 * another first-party persistence service) through this tiny interface.
 * No vendor SDK or advertising provider is required by the core.
 */

import type { PromoteLedger, PromoteLedgerEntry } from './promote-ledger';

export const PROMOTE_LEDGER_FORMAT_VERSION = 1 as const;

export interface PromoteLedgerSnapshot {
  formatVersion: typeof PROMOTE_LEDGER_FORMAT_VERSION;
  entries: PromoteLedgerEntry[];
}

export interface PromoteDurableStore {
  load(): Promise<string | undefined>;
  save(serialized: string): Promise<void>;
}

export interface PromoteLedgerPersistence {
  loadInto(ledger: PromoteLedger): Promise<void>;
  flushFrom(ledger: PromoteLedger): Promise<void>;
}

function snapshot(ledger: PromoteLedger): PromoteLedgerSnapshot {
  return {
    formatVersion: PROMOTE_LEDGER_FORMAT_VERSION,
    entries: ledger.list(),
  };
}

function parseSnapshot(serialized: string): PromoteLedgerSnapshot {
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid Promote ledger snapshot');

  const candidate = parsed as Partial<PromoteLedgerSnapshot>;
  if (candidate.formatVersion !== PROMOTE_LEDGER_FORMAT_VERSION) {
    throw new Error(`Unsupported Promote ledger format: ${String(candidate.formatVersion)}`);
  }
  if (!Array.isArray(candidate.entries)) throw new Error('Promote ledger entries must be an array');

  return {
    formatVersion: PROMOTE_LEDGER_FORMAT_VERSION,
    entries: candidate.entries.map((entry) => {
      if (!entry || typeof entry !== 'object') throw new Error('Invalid Promote ledger entry');
      const value = entry as PromoteLedgerEntry;
      if (!value.event || typeof value.event.campaignId !== 'string') {
        throw new Error('Invalid Promote audit event');
      }
      return { ...value };
    }),
  };
}

/** Canonical serialization makes persisted ledgers deterministic and auditable. */
export function serializePromoteLedger(ledger: PromoteLedger): string {
  return JSON.stringify(snapshot(ledger));
}

export function restorePromoteLedger(serialized: string, ledger: PromoteLedger): void {
  const restored = parseSnapshot(serialized);
  for (const entry of restored.entries) ledger.append({ ...entry });
}

/**
 * Reference persistence coordinator. The store is deliberately injected so
 * Phantom can replace the underlying medium without changing the control plane.
 */
export class PhantomPromoteLedgerPersistence implements PromoteLedgerPersistence {
  constructor(private readonly store: PromoteDurableStore) {}

  async loadInto(ledger: PromoteLedger): Promise<void> {
    const serialized = await this.store.load();
    if (serialized === undefined) return;
    restorePromoteLedger(serialized, ledger);
  }

  async flushFrom(ledger: PromoteLedger): Promise<void> {
    await this.store.save(serializePromoteLedger(ledger));
  }
}
