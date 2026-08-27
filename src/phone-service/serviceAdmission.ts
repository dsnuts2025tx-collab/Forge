import { AdminControlState } from "./adminControl.js";
import { ProductionEvidence, evaluateProductionReadiness } from "./productionGate.js";

export type AdmissionDecision = {
  allowed: boolean;
  reasons: string[];
};

/**
 * Single fail-closed admission boundary for customer service activation.
 * A $0 entitlement never bypasses provider authorization or funding controls.
 */
export function evaluateServiceAdmission(evidence: ProductionEvidence): AdmissionDecision {
  const reasons: string[] = [];
  const readiness = evaluateProductionReadiness(evidence);

  if (!readiness.ready) reasons.push(...readiness.blockers);
  if (evidence.adminState !== AdminControlState.ENABLED) reasons.push("service administration is not enabled");
  if (!evidence.customerEntitlementZero) reasons.push("customer entitlement is not $0");
  if (!evidence.providerAuthorizationVerified) reasons.push("provider authorization is not verified");
  if (!evidence.deviceCompatibilityVerified) reasons.push("compatible device is not verified");
  if (!evidence.fundingCoverageVerified) reasons.push("funding coverage is not verified");

  return { allowed: reasons.length === 0, reasons: [...new Set(reasons)] };
}
