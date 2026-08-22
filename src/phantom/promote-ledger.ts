/**
 * Phantom-controlled audit/evidence ledger contract.
 *
 * The control plane owns the ledger semantics. Durable storage is an adapter
 * behind this interface, so the core does not become dependent on a vendor
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

/**
 * Reference implementation for local/tests. Production deployments should
 * provide a Phantom-owned durable adapter implementing the same contract.
 */
export class InMemoryPromoteLedger implements PromoteLedger {
  private readonly entries: PromoteLedgerEntry[] = [];

  append(entry: PromoteLedgerEntry): void {
    this.entries.push(entry);
  }

  list(campaignId?: string): PromoteLedgerEntry[] {
    return this.entries
      .filter((entry) => !campaignId || entry.event.campaignId === campaignId)
      .map((entry) => ({ ...entry }));
  }

  latest(campaignId: string): PromoteLedgerEntry | undefined {
    const entries = this.list(campaignId);
    return entries[entries.length - 1];
  }
}
