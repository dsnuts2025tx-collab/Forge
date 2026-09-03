import { AdminControlState } from "./admin-controls.js";
import { evaluateDeploymentReadiness } from "./deployment-readiness.js";

export type ProductionSmokeResult = {
  ready: boolean;
  blockers: string[];
};

/** Reference smoke gate: reports readiness without claiming live carrier/satellite connectivity. */
export function runProductionSmoke(): ProductionSmokeResult {
  const readiness = evaluateDeploymentReadiness({
    adminState: AdminControlState.ENABLED,
    customerEntitlementZero: true,
    providerAuthorizationVerified: false,
    credentialsProvisioned: false,
    compatibleHardwareVerified: false,
    noWifiConnectivityObserved: false,
    fundingCoverageVerified: false,
    authoritativeBillingReconciled: false,
    satelliteAgreementVerified: false,
    satelliteFallbackObserved: false,
  });

  return { ready: readiness.ready, blockers: [...readiness.blockers] };
}
