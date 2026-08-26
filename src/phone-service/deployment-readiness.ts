import { AdminPolicy, FundingPosition, ProductionEvidence, isProductionReady } from "./mvp.js";
import { AdminState } from "./admin-controls.js";

export interface DeploymentReadiness {
  ready: boolean;
  blockers: string[];
}

export function evaluateDeploymentReadiness(
  evidence: ProductionEvidence,
  policy: AdminPolicy,
  funding: FundingPosition,
  adminState: AdminState,
): DeploymentReadiness {
  const blockers: string[] = [];

  if (!isProductionReady(evidence, policy, funding)) {
    blockers.push("mandatory production evidence or funding gate is incomplete");
  }
  if (adminState !== "enabled") {
    blockers.push(`admin service state is ${adminState}`);
  }
  if (funding.availableMinor - funding.reservedMinor < funding.projectedProviderCostMinor) {
    blockers.push("funding does not cover projected provider cost after reservations");
  }
  if (!evidence.noWifiCellularObserved) {
    blockers.push("no-Wi-Fi cellular proof is missing");
  }

  return { ready: blockers.length === 0, blockers };
}
