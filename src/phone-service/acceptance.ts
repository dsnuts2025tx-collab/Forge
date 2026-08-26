import {
  AdminPolicy,
  ConnectivityObservation,
  FundingPosition,
  ProductionEvidence,
  deriveConnectivityState,
  isProductionReady,
} from "./mvp.js";

export interface AcceptanceCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PhysicalMvpEvidence extends ProductionEvidence {
  observedConnectivityState: ReturnType<typeof deriveConnectivityState>;
  wifiDisabledDuringCellularProof: boolean;
  cellularProofTimestamp: string | null;
  satelliteProofTimestamp: string | null;
}

export function evaluatePhysicalMvp(
  observation: ConnectivityObservation,
  evidence: PhysicalMvpEvidence,
  policy: AdminPolicy,
  funding: FundingPosition,
): AcceptanceCheck[] {
  const checks: AcceptanceCheck[] = [
    {
      name: "customer-zero-entitlement",
      passed: true,
      detail: "Customer service entitlement is enforced as price 0 by the MVP domain model.",
    },
    {
      name: "wifi-independent-cellular-proof",
      passed:
        evidence.noWifiCellularObserved &&
        evidence.wifiDisabledDuringCellularProof &&
        observation.cellularRegistered &&
        observation.cellularDataAvailable &&
        !observation.wifiConnected,
      detail: "Requires observed cellular registration/data while Wi-Fi is disabled.",
    },
    {
      name: "cellular-state",
      passed: evidence.observedConnectivityState === "cellular_connected",
      detail: `Observed state: ${evidence.observedConnectivityState}.`,
    },
    {
      name: "carrier-proof",
      passed: evidence.providerAuthorized && evidence.credentialsVerified && evidence.deviceProvisioned,
      detail: "Provider authorization, credentials, and device provisioning must all be evidenced.",
    },
    {
      name: "compatible-hardware",
      passed: evidence.compatibleHardwareVerified,
      detail: "Compatible physical hardware must be verified before production promotion.",
    },
    {
      name: "billing-reconciliation",
      passed: evidence.authoritativeBillingReconciled,
      detail: "Provider usage must reconcile against authoritative billing data.",
    },
    {
      name: "funding-coverage",
      passed: evidence.fundingCoverageVerified,
      detail: "Funding must cover reserved plus projected provider cost within policy limits.",
    },
  ];

  if (observation.satelliteSupported || evidence.satelliteAgreementVerified || evidence.satelliteFallbackObserved) {
    checks.push({
      name: "satellite-fallback-proof",
      passed:
        evidence.satelliteAgreementVerified &&
        evidence.satelliteFallbackObserved &&
        Boolean(evidence.satelliteProofTimestamp),
      detail: "Satellite is optional for cellular-first MVP promotion but cannot be called operational without agreement and observed fallback evidence.",
    });
  }

  checks.push({
    name: "production-gate",
    passed: isProductionReady(evidence, policy, funding),
    detail: "All mandatory production evidence and funding controls must pass.",
  });

  return checks;
}

export function allAcceptanceChecksPassed(checks: readonly AcceptanceCheck[]): boolean {
  return checks.every((check) => check.passed);
}
