import type { FundingPosition, ProviderUsageEvent, UsageLedgerEntry } from "./mvp.js";

export interface UsageLedgerStore {
  has(eventId: string): Promise<boolean>;
  append(entry: UsageLedgerEntry): Promise<void>;
}

export interface FundingGuardResult {
  allowed: boolean;
  projectedAfterReserveMinor: number;
  reason: "covered" | "funding_shortfall" | "unreconciled_cost";
}

/**
 * Idempotent usage ingestion boundary. Provider event IDs are the dedupe key;
 * the ledger never silently replaces an existing event.
 */
export async function ingestUsageEvent(
  event: ProviderUsageEvent,
  authoritativeCostMinor: number | null,
  store: UsageLedgerStore,
): Promise<"appended" | "duplicate"> {
  if (await store.has(event.id)) return "duplicate";

  const entry: UsageLedgerEntry = {
    ...event,
    authoritativeCostMinor,
    costStatus: authoritativeCostMinor === null ? "unreconciled" : "reconciled",
  };
  await store.append(entry);
  return "appended";
}

/**
 * Funding is evaluated against authoritative/reconciled projected provider
 * cost. An unreconciled projection fails closed when a strict guard is used.
 */
export function evaluateFundingGuard(
  funding: FundingPosition,
  projectedProviderCostMinor: number | null,
  requireAuthoritativeCost = true,
): FundingGuardResult {
  if (projectedProviderCostMinor === null && requireAuthoritativeCost) {
    return {
      allowed: false,
      projectedAfterReserveMinor: funding.availableMinor - funding.reservedMinor,
      reason: "unreconciled_cost",
    };
  }

  const projected = projectedProviderCostMinor ?? 0;
  const projectedAfterReserve =
    funding.availableMinor - funding.reservedMinor - projected;

  return {
    allowed: projectedAfterReserve >= 0,
    projectedAfterReserveMinor: projectedAfterReserve,
    reason: projectedAfterReserve >= 0 ? "covered" : "funding_shortfall",
  };
}
