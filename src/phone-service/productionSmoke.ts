import { AdminControlState } from "./adminControl.js";
import { DeploymentEvidence, evaluateDeploymentReadiness } from "./deploymentReadiness.js";

export type SmokeResult = {
  passed: boolean;
  failures: string[];
};

export function runProductionSmoke(evidence: DeploymentEvidence): SmokeResult {
  const failures: string[] = [];
  const readiness = evaluateDeploymentReadiness(evidence);

  if (!readiness.ready) failures.push(...readiness.blockers);
  if (evidence.adminState !== AdminControlState.ENABLED) failures.push("admin service is not enabled");
  if (!evidence.customerEntitlementZero) failures.push("customer entitlement is not $0");
  if (!evidence.cellularObservedWithWifiDisabled) failures.push("Wi-Fi-disabled cellular proof missing");
  if (!evidence.providerAuthorizationVerified) failures.push("provider authorization missing");
  if (!evidence.deviceCompatibilityVerified) failures.push("compatible device proof missing");
  if (!evidence.billingReconciliationVerified) failures.push("authoritative billing reconciliation missing");
  if (!evidence.fundingCoverageVerified) failures.push("funding coverage missing");

  return { passed: failures.length === 0, failures: [...new Set(failures)] };
}
