import type { AdminPolicy, FundingPosition, ProductionEvidence } from "./mvp.js";
import { isProductionReady } from "./mvp.js";

export type GateResult = {
  ready: boolean;
  blockedBy: string[];
};

export function evaluateProductionGate(
  evidence: ProductionEvidence,
  policy: AdminPolicy,
  funding: FundingPosition,
): GateResult {
  const blockedBy: string[] = [];

  if (!evidence.providerAuthorized) blockedBy.push("cellular provider authorization");
  if (!evidence.credentialsVerified) blockedBy.push("production provider credentials");
  if (!evidence.deviceProvisioned) blockedBy.push("provisioned SIM/eSIM/device");
  if (!evidence.compatibleHardwareVerified) blockedBy.push("compatible physical hardware");
  if (!evidence.noWifiCellularObserved) blockedBy.push("Wi-Fi-disabled cellular attachment evidence");
  if (!evidence.authoritativeBillingReconciled) blockedBy.push("authoritative provider billing reconciliation");
  if (!evidence.fundingCoverageVerified) blockedBy.push("verified provider-cost funding coverage");
  if (funding.availableMinor - funding.reservedMinor < funding.projectedProviderCostMinor) {
    blockedBy.push("funding balance below projected provider cost");
  }
  if (funding.projectedProviderCostMinor > policy.maxProjectedCostMinor) {
    blockedBy.push("projected cost exceeds admin policy ceiling");
  }

  return { ready: isProductionReady(evidence, policy, funding), blockedBy };
}

export function satelliteFallbackMayBeClaimed(evidence: ProductionEvidence): boolean {
  return evidence.satelliteAgreementVerified && evidence.satelliteFallbackObserved;
}
