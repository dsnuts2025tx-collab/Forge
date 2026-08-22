/**
 * Phantom-controlled durable ledger adapter boundary.
 *
 * The storage engine is deliberately injected: Phantom owns the ledger
 * contract, serialization, integrity checks, and replay semantics without
 * coupling the control plane to a database vendor.
 */

import type { PromoteLedger, PromoteLedgerEntry } from './promote-ledger';
import { verifyPromoteLedger } from './promote-ledger-integrity';

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

function assertIntegrity(entries: PromoteLedgerEntry[], operation: 'load' | 'save'): void {
  const report = verifyPromoteLedger(entries);
  if (!report.valid) {
    throw new Error(`Promote ledger integrity failure during ${operation}: ${report.errors.join('; ')}`);
  }
}

/**
 * Durable adapter for any Phantom-controlled persistent store.
 * `load` and `save` are the only persistence boundary; the ledger semantics
 * remain entirely inside Phantom.
 *
 * Restored and persisted state is fail-closed: malformed or internally
 * inconsistent entries are rejected before they enter or leave the control
 * plane.
 */
export class PersistentPromoteLedger implements PromoteLedger {
  private entries: PromoteLedgerEntry[];

  constructor(private readonly store: PromoteLedgerStore) {
    const restored = cloneEntries(store.load());
    assertIntegrity(restored, 'load');
    this.entries = restored;
  }

  append(entry: PromoteLedgerEntry): void {
    const nextEntries = [...this.entries, cloneEntry(entry)];
    assertIntegrity(nextEntries, 'save');
    this.entries = nextEntries;
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
    const restored = cloneEntries(this.store.load());
    assertIntegrity(restored, 'load');
    this.entries = restored;
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
    const nextEntries = cloneEntries(entries);
    assertIntegrity(nextEntries, 'save');
    this.entries = nextEntries;
  }
}
