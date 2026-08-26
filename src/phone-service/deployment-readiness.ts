import { AdminPolicy, FundingPosition, ProductionEvidence, isProductionReady } from "./mvp.js";
import { AdminControlState } from "./admin-controls.js";

export interface DeploymentReadiness {
  ready: boolean;
  blockers: string[];
}

export function evaluateDeploymentReadiness(
  evidence: ProductionEvidence,
  policy: AdminPolicy,
  funding: FundingPosition,
  adminState: AdminControlState,
): DeploymentReadiness {
  const blockers: string[] = [];

  if (!isProductionReady(evidence, policy, funding)) {
    blockers.push("mandatory production evidence or funding gate is incomplete");
  }
  if (adminState.mode !== "ENABLED") {
    blockers.push(`admin service mode is ${adminState.mode}`);
  }
  if (funding.availableMinor - funding.reservedMinor < funding.projectedProviderCostMinor) {
    blockers.push("funding does not cover projected provider cost after reservations");
  }
  if (!evidence.noWifiCellularObserved) {
    blockers.push("no-Wi-Fi cellular proof is missing");
  }

  return { ready: blockers.length === 0, blockers };
}
