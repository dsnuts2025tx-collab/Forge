export type Transport = "cellular" | "satellite" | "offline";
export type ConnectivityState =
  | "cellular_connected"
  | "cellular_degraded"
  | "satellite_eligible"
  | "satellite_active"
  | "offline";

export interface ConnectivityObservation {
  observedAt: string;
  wifiConnected: boolean;
  cellularRegistered: boolean;
  cellularDataAvailable: boolean;
  satelliteSupported: boolean;
  satelliteEntitled: boolean;
  satelliteConnected: boolean;
}

export interface ProviderUsageEvent {
  id: string;
  provider: string;
  simId: string;
  deviceId: string;
  observedAt: string;
  dataBytes: number;
  smsCount: number;
  providerCostMinor?: number;
  currency?: string;
  authoritativeBillReference?: string;
}

export interface UsageLedgerEntry extends ProviderUsageEvent {
  authoritativeCostMinor: number | null;
  costStatus: "unreconciled" | "reconciled";
}

export interface FundingPosition {
  currency: string;
  availableMinor: number;
  reservedMinor: number;
  projectedProviderCostMinor: number;
}

export interface CustomerEntitlement {
  customerId: string;
  servicePriceMinor: 0;
  active: boolean;
}

export interface AdminPolicy {
  allowCellular: boolean;
  allowSatellite: boolean;
  maxProjectedCostMinor: number;
  suspendOnFundingShortfall: boolean;
}

export interface ProductionEvidence {
  providerAuthorized: boolean;
  credentialsVerified: boolean;
  deviceProvisioned: boolean;
  compatibleHardwareVerified: boolean;
  noWifiCellularObserved: boolean;
  authoritativeBillingReconciled: boolean;
  fundingCoverageVerified: boolean;
  satelliteAgreementVerified: boolean;
  satelliteFallbackObserved: boolean;
}

export function deriveConnectivityState(
  observation: ConnectivityObservation,
): ConnectivityState {
  if (observation.cellularRegistered && observation.cellularDataAvailable) {
    return "cellular_connected";
  }

  if (observation.satelliteSupported && observation.satelliteEntitled && !observation.wifiConnected) {
    return observation.satelliteConnected ? "satellite_active" : "satellite_eligible";
  }

  if (observation.cellularRegistered && !observation.cellularDataAvailable) {
    return "cellular_degraded";
  }

  return "offline";
}

export function transportForState(state: ConnectivityState): Transport {
  switch (state) {
    case "cellular_connected":
    case "cellular_degraded":
      return "cellular";
    case "satellite_eligible":
    case "satellite_active":
      return "satellite";
    case "offline":
      return "offline";
  }
}

export function isProductionReady(
  evidence: ProductionEvidence,
  policy: AdminPolicy,
  funding: FundingPosition,
): boolean {
  const externalProof =
    evidence.providerAuthorized &&
    evidence.credentialsVerified &&
    evidence.deviceProvisioned &&
    evidence.compatibleHardwareVerified &&
    evidence.noWifiCellularObserved &&
    evidence.authoritativeBillingReconciled &&
    evidence.fundingCoverageVerified;

  const fundingReady =
    funding.availableMinor - funding.reservedMinor >= funding.projectedProviderCostMinor &&
    funding.projectedProviderCostMinor <= policy.maxProjectedCostMinor;

  return externalProof && fundingReady;
}

export function reconcileUsage(
  events: readonly ProviderUsageEvent[],
  authoritativeCosts: ReadonlyMap<string, number>,
): UsageLedgerEntry[] {
  return events.map((event) => {
    const authoritativeCostMinor = authoritativeCosts.get(event.id) ?? null;
    return {
      ...event,
      authoritativeCostMinor,
      costStatus: authoritativeCostMinor === null ? "unreconciled" : "reconciled",
    };
  });
}

export function customerEntitlement(customerId: string, active = true): CustomerEntitlement {
  return { customerId, servicePriceMinor: 0, active };
}

export function canServeCustomer(
  entitlement: CustomerEntitlement,
  policy: AdminPolicy,
  funding: FundingPosition,
): boolean {
  if (!entitlement.active || entitlement.servicePriceMinor !== 0) return false;
  if (!policy.allowCellular && !policy.allowSatellite) return false;
  const projectedAfterReserve = funding.availableMinor - funding.reservedMinor - funding.projectedProviderCostMinor;
  return projectedAfterReserve >= 0 || !policy.suspendOnFundingShortfall;
}
