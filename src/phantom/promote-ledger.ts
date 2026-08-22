/**
 * Phantom-controlled audit/evidence ledger contract.
 *
 * The control plane owns ledger semantics. Durable storage remains an adapter
 * behind this interface so the core does not become dependent on a vendor
 * database or external advertising provider.
 */

import type { PromoteAuditEvent } from './promote-orchestrator';
import type { CampaignProof } from './promote-proof';

export interface PromoteLedgerEntry {
  event: PromoteAuditEvent;
  proof?: CampaignProof;
}

export interface PromoteLedger {
  append(entry: PromoteLedgerEntry): void;
  list(campaignId?: string): PromoteLedgerEntry[];
  latest(campaignId: string): PromoteLedgerEntry | undefined;
}

function cloneEntry(entry: PromoteLedgerEntry): PromoteLedgerEntry {
  return {
    event: { ...entry.event, ...(entry.event.metadata ? { metadata: { ...entry.event.metadata } } : {}) },
    ...(entry.proof
      ? {
          proof: {
            ...entry.proof,
            criteriaSatisfied: [...entry.proof.criteriaSatisfied],
            metricSnapshot: { ...entry.proof.metricSnapshot },
          },
        }
      : {}),
  };
}

/**
 * Reference implementation for local/tests. Production deployments provide
 * a Phantom-owned durable adapter implementing the same contract.
 *
 * Entries are defensively cloned on both write and read, making the ledger
 * append-only from the caller's perspective and preventing nested proof or
 * metadata objects from being mutated after they are recorded.
 */
export class InMemoryPromoteLedger implements PromoteLedger {
  private readonly entries: PromoteLedgerEntry[] = [];

  append(entry: PromoteLedgerEntry): void {
    this.entries.push(cloneEntry(entry));
  }

  list(campaignId?: string): PromoteLedgerEntry[] {
    return this.entries
      .filter((entry) => !campaignId || entry.event.campaignId === campaignId)
      .map(cloneEntry);
  }

  latest(campaignId: string): PromoteLedgerEntry | undefined {
    const entries = this.list(campaignId);
    return entries[entries.length - 1];
  }
}
