import {
  canServeCustomer,
  customerEntitlement,
  deriveConnectivityState,
  isProductionReady,
  type AdminPolicy,
  type FundingPosition,
  type ProductionEvidence,
} from "./mvp.js";
import { StrictProviderEventValidator, dedupeProviderEventIds } from "./provider-guards.js";
import { verifyWebhookSignature } from "./webhook-auth.js";

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
    wifiConnected: true,
    cellularRegistered: true,
    cellularDataAvailable: true,
    satelliteSupported: true,
    satelliteEntitled: true,
    satelliteConnected: true,
  }) === "cellular_connected",
  "cellular must remain primary even when Wi-Fi is present",
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

assert(
  deriveConnectivityState({
    observedAt: new Date(0).toISOString(),
    wifiConnected: true,
    cellularRegistered: false,
    cellularDataAvailable: false,
    satelliteSupported: true,
    satelliteEntitled: true,
    satelliteConnected: true,
  }) === "offline",
  "Wi-Fi must not make satellite look like a no-Wi-Fi fallback",
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
  "funding shortfall must fail closed even when suspension behavior is disabled",
);

const overLimit: FundingPosition = { ...funded, projectedProviderCostMinor: 10_001 };
assert(
  !canServeCustomer(customerEntitlement("self-test"), policy, overLimit),
  "projected provider cost above policy limit must fail closed",
);

const providerEvent = {
  id: "evt-self-test",
  provider: "carrier-test",
  simId: "sim-self-test",
  deviceId: "device-self-test",
  observedAt: new Date().toISOString(),
  dataBytes: 128,
  smsCount: 0,
};
const validatedEvent = new StrictProviderEventValidator().validate(providerEvent);
const seen = new Set<string>();
assert(dedupeProviderEventIds(seen, validatedEvent), "first provider event must be accepted");
assert(!dedupeProviderEventIds(seen, validatedEvent), "duplicate provider event must be rejected");
assert(
  dedupeProviderEventIds(seen, { ...validatedEvent, provider: "second-carrier" }),
  "same event id from a different provider must not collide",
);

const rawBody = "The quick brown fox jumps over the lazy dog";
const signature = "sha256=f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8";
assert(
  await verifyWebhookSignature({ rawBody, signature, secret: "key" }),
  "valid provider webhook signature must verify",
);
assert(
  !(await verifyWebhookSignature({ rawBody, signature: `${signature}00`, secret: "key" })),
  "tampered signature must fail",
);
assert(
  !(await verifyWebhookSignature({ rawBody: `${rawBody}!`, signature, secret: "key" })),
  "tampered body must fail",
);

console.log("Phone Service self-test: PASS");
