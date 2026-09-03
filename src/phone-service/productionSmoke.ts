import { AdminControlState } from "./admin-controls.js";
import { evaluateDeploymentReadiness } from "./deployment-readiness.js";
import type { AdminPolicy, FundingPosition, ProductionEvidence } from "./mvp.js";

export type ProductionSmokeResult = {
  ready: boolean;
  blockers: string[];
};

/** Reference smoke gate: reports readiness without claiming live carrier/satellite connectivity. */
export function runProductionSmoke(): ProductionSmokeResult {
  const policy: AdminPolicy = {
    allowCellular: true,
    allowSatellite: true,
    maxProjectedCostMinor: 10_000,
    suspendOnFundingShortfall: true,
  };
  const funding: FundingPosition = {
    currency: "USD",
    availableMinor: 20_000,
    reservedMinor: 2_000,
    projectedProviderCostMinor: 1_000,
  };
  const evidence: ProductionEvidence = {
    providerAuthorized: false,
    credentialsVerified: false,
    deviceProvisioned: false,
    compatibleHardwareVerified: false,
    noWifiCellularObserved: false,
    authoritativeBillingReconciled: false,
    fundingCoverageVerified: false,
    satelliteAgreementVerified: false,
    satelliteFallbackObserved: false,
  };
  const adminState: AdminControlState = {
    mode: "ENABLED",
    reason: null,
    changedAt: new Date().toISOString(),
    changedBy: "production-smoke",
  };

  const readiness = evaluateDeploymentReadiness(evidence, policy, funding, adminState);
  return { ready: readiness.ready, blockers: [...readiness.blockers] };
}
