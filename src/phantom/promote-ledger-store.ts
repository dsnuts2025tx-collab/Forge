/**
 * Phantom-controlled durable ledger adapter boundary.
 *
 * The storage engine is deliberately injected: Phantom owns the ledger
 * contract, serialization, integrity checks, and replay semantics without
 * coupling the control plane to a database vendor.
 */

import type { PromoteLedger, PromoteLedgerEntry } from './promote-ledger';

export interface PromoteLedgerStore {
  load(): PromoteLedgerEntry[];
  save(entries: PromoteLedgerEntry[]): void;
}

function cloneEntry(entry: PromoteLedgerEntry): PromoteLedgerEntry {
  return JSON.parse(JSON.stringify(entry)) as PromoteLedgerEntry;
}

function cloneEntries(entries: PromoteLedgerEntry[]): PromoteLedgerEntry[] {
  return entries.map(cloneEntry);
}

/**
 * Durable adapter for any Phantom-controlled persistent store.
 * `load` and `save` are the only persistence boundary; the ledger semantics
 * remain entirely inside Phantom.
 */
export class PersistentPromoteLedger implements PromoteLedger {
  private entries: PromoteLedgerEntry[];

  constructor(private readonly store: PromoteLedgerStore) {
    this.entries = cloneEntries(store.load());
  }

  append(entry: PromoteLedgerEntry): void {
    this.entries.push(cloneEntry(entry));
    this.store.save(cloneEntries(this.entries));
  }

  list(campaignId?: string): PromoteLedgerEntry[] {
    return cloneEntries(
      this.entries.filter((entry) => !campaignId || entry.event.campaignId === campaignId),
    );
  }

  latest(campaignId: string): PromoteLedgerEntry | undefined {
    const entries = this.list(campaignId);
    return entries[entries.length - 1];
  }

  reload(): void {
    this.entries = cloneEntries(this.store.load());
  }
}

/**
 * Simple process-backed persistence for controlled runtimes/tests.
 * Production can replace this store with a database, object store, or
 * Phantom-owned service without changing Promote orchestration semantics.
 */
export class MemoryBackedPromoteLedgerStore implements PromoteLedgerStore {
  private entries: PromoteLedgerEntry[] = [];

  load(): PromoteLedgerEntry[] {
    return cloneEntries(this.entries);
  }

  save(entries: PromoteLedgerEntry[]): void {
    this.entries = cloneEntries(entries);
  }
}
