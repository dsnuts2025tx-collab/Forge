import type { AdminControlState } from "./admin-controls.js";
import { evaluateProductionGate } from "./production-gate.js";
import type { AdminPolicy, FundingPosition, ProductionEvidence } from "./mvp.js";

export type AdmissionDecision = {
  allowed: boolean;
  reasons: string[];
};

export type ServiceAdmissionEvidence = ProductionEvidence & {
  adminState: AdminControlState;
  customerEntitlementZero: boolean;
  policy: AdminPolicy;
  funding: FundingPosition;
};

/**
 * Single fail-closed admission boundary for customer service activation.
 * A $0 entitlement never bypasses provider authorization or funding controls.
 */
export function evaluateServiceAdmission(evidence: ServiceAdmissionEvidence): AdmissionDecision {
  const reasons: string[] = [];
  const readiness = evaluateProductionGate(evidence, evidence.policy, evidence.funding);

  if (!readiness.ready) reasons.push(...readiness.blockedBy);
  if (evidence.adminState.mode !== "ENABLED") reasons.push("service administration is not enabled");
  if (!evidence.customerEntitlementZero) reasons.push("customer entitlement is not $0");

  return { allowed: reasons.length === 0, reasons: [...new Set(reasons)] };
}
