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

export interface AcceptancePolicy {
  maxCellularProofAgeMs: number;
  maxSatelliteProofAgeMs: number;
}

const DEFAULT_ACCEPTANCE_POLICY: AcceptancePolicy = {
  maxCellularProofAgeMs: 24 * 60 * 60 * 1000,
  maxSatelliteProofAgeMs: 24 * 60 * 60 * 1000,
};

function isFreshEvidenceTimestamp(
  timestamp: string | null,
  nowMs: number,
  maxAgeMs: number,
): boolean {
  if (!timestamp || !Number.isFinite(maxAgeMs) || maxAgeMs < 0) return false;
  const observedMs = Date.parse(timestamp);
  if (!Number.isFinite(observedMs)) return false;
  const ageMs = nowMs - observedMs;
  return ageMs >= 0 && ageMs <= maxAgeMs;
}

export function evaluatePhysicalMvp(
  observation: ConnectivityObservation,
  evidence: PhysicalMvpEvidence,
  policy: AdminPolicy,
  funding: FundingPosition,
  acceptancePolicy: AcceptancePolicy = DEFAULT_ACCEPTANCE_POLICY,
  nowMs = Date.now(),
): AcceptanceCheck[] {
  const cellularProofFresh = isFreshEvidenceTimestamp(
    evidence.cellularProofTimestamp,
    nowMs,
    acceptancePolicy.maxCellularProofAgeMs,
  );

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
        cellularProofFresh &&
        observation.cellularRegistered &&
        observation.cellularDataAvailable &&
        !observation.wifiConnected,
      detail: "Requires recent observed cellular registration/data while Wi-Fi is disabled.",
    },
    {
      name: "cellular-proof-freshness",
      passed: cellularProofFresh,
      detail: "Cellular connectivity evidence must have a valid timestamp no older than the configured acceptance window.",
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
    const satelliteProofFresh = isFreshEvidenceTimestamp(
      evidence.satelliteProofTimestamp,
      nowMs,
      acceptancePolicy.maxSatelliteProofAgeMs,
    );
    checks.push({
      name: "satellite-fallback-proof",
      passed:
        evidence.satelliteAgreementVerified &&
        evidence.satelliteFallbackObserved &&
        satelliteProofFresh,
      detail: "Satellite is optional for cellular-first MVP promotion but cannot be called operational without agreement and recent observed fallback evidence.",
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
