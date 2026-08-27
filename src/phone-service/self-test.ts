import {
  canServeCustomer,
  customerEntitlement,
  deriveConnectivityState,
  isProductionReady,
  type AdminPolicy,
  type FundingPosition,
  type ProductionEvidence,
} from "./mvp.js";

const policy: AdminPolicy = {
  allowCellular: true,
  allowSatellite: true,
  maxProjectedCostMinor: 10_000,
  suspendOnFundingShortfall: true,
};

const funded: FundingPosition = {
  currency: "USD",
  availableMinor: 20_000,
  reservedMinor: 2_000,
  projectedProviderCostMinor: 1_000,
};

const evidence: ProductionEvidence = {
  providerAuthorized: true,
  credentialsVerified: true,
  deviceProvisioned: true,
  compatibleHardwareVerified: true,
  noWifiCellularObserved: true,
  authoritativeBillingReconciled: true,
  fundingCoverageVerified: true,
  satelliteAgreementVerified: true,
  satelliteFallbackObserved: true,
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Phone Service self-test failed: ${message}`);
}

assert(
  deriveConnectivityState({
    observedAt: new Date(0).toISOString(),
    wifiConnected: false,
    cellularRegistered: true,
    cellularDataAvailable: true,
    satelliteSupported: false,
    satelliteEntitled: false,
    satelliteConnected: false,
  }) === "cellular_connected",
  "cellular must win when registered and data is available",
);

assert(
  deriveConnectivityState({
    observedAt: new Date(0).toISOString(),
    wifiConnected: false,
    cellularRegistered: false,
    cellularDataAvailable: false,
    satelliteSupported: true,
    satelliteEntitled: true,
    satelliteConnected: true,
  }) === "satellite_active",
  "satellite fallback must be observable before activation",
);

assert(isProductionReady(evidence, policy, funded), "complete evidence and funding must pass");
assert(canServeCustomer(customerEntitlement("self-test"), policy, funded), "funded $0 customer must be serviceable");

assert(
  !canServeCustomer(customerEntitlement("self-test", false), policy, funded),
  "inactive $0 entitlement must not be serviceable",
);

const shortfall: FundingPosition = { ...funded, availableMinor: 2_500 };
assert(
  !canServeCustomer(customerEntitlement("self-test"), policy, shortfall),
  "funding shortfall must fail closed",
);

console.log("Phone Service self-test: PASS");
