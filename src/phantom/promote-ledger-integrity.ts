/**
 * Phantom-owned ledger integrity and replay verification.
 *
 * Restored state is never trusted merely because it parses. This module
 * validates the canonical event/proof relationships before a ledger can be
 * admitted to the Promote control plane.
 */

import type { PromoteLedger, PromoteLedgerEntry } from './promote-ledger';
import { serializePromoteLedger } from './promote-ledger-persistence';

export interface PromoteLedgerIntegrityReport {
  valid: boolean;
  entryCount: number;
  campaigns: number;
  errors: string[];
  digest: string;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

/** Deterministic FNV-1a digest; used for change/replay detection, not secrecy. */
function digest(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function verifyPromoteLedger(entries: PromoteLedgerEntry[]): PromoteLedgerIntegrityReport {
  const errors: string[] = [];
  const campaignIds = new Set<string>();
  const seenEventIds = new Set<string>();
  const seenEvidence = new Set<string>();

  entries.forEach((entry, index) => {
    const event = entry?.event;
    if (!event?.id || !event.campaignId || !event.event || !event.occurredAt || !event.actor) {
      errors.push(`entry ${index}: incomplete audit event`);
      return;
    }

    campaignIds.add(event.campaignId);
    if (seenEventIds.has(event.id)) errors.push(`entry ${index}: duplicate event id ${event.id}`);
    seenEventIds.add(event.id);

    if (Number.isNaN(Date.parse(event.occurredAt))) {
      errors.push(`entry ${index}: invalid event timestamp`);
    }

    if (event.event === 'CAMPAIGN_PROVEN' && !entry.proof) {
      errors.push(`entry ${index}: CAMPAIGN_PROVEN requires proof`);
    }

    if (entry.proof) {
      if (entry.proof.campaignId !== event.campaignId) {
        errors.push(`entry ${index}: proof campaign mismatch`);
      }
      if (!entry.proof.evidenceId || !entry.proof.source) {
        errors.push(`entry ${index}: incomplete proof identity`);
      }
      const evidenceKey = `${entry.proof.campaignId}:${entry.proof.evidenceId}`;
      if (seenEvidence.has(evidenceKey)) {
        errors.push(`entry ${index}: duplicate evidence identity ${evidenceKey}`);
      }
      seenEvidence.add(evidenceKey);
    }
  });

  return {
    valid: errors.length === 0,
    entryCount: entries.length,
    campaigns: campaignIds.size,
    errors,
    digest: digest(stableJson(entries)),
  };
}

/** Verify a live ledger without mutating it. */
export function verifyPromoteLedgerInstance(ledger: PromoteLedger): PromoteLedgerIntegrityReport {
  return verifyPromoteLedger(ledger.list());
}

/** Canonical replay check: serialize the accepted ledger and verify its state. */
export function verifyPromoteLedgerReplay(ledger: PromoteLedger): PromoteLedgerIntegrityReport {
  const serialized = serializePromoteLedger(ledger);
  const parsed = JSON.parse(serialized) as { entries: PromoteLedgerEntry[] };
  return verifyPromoteLedger(parsed.entries);
}
