import {
  canServeCustomer,
  canServeCustomerWithConnectivity,
  customerEntitlement,
  deriveConnectivityState,
  isProductionReady,
  reconcileUsage,
  type AdminPolicy,
  type FundingPosition,
  type ProductionEvidence,
} from "./mvp.js";
import { StrictProviderEventValidator, dedupeProviderEventIds } from "./provider-guards.js";
import { verifyWebhookSignature } from "./webhook-auth.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Phone Service self-test failed: ${message}`);
}

async function runSelfTest(): Promise<void> {
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

  const cellularObservation = {
    observedAt: new Date(0).toISOString(),
    wifiConnected: false,
    cellularRegistered: true,
    cellularDataAvailable: true,
    satelliteSupported: false,
    satelliteEntitled: false,
    satelliteConnected: false,
  };
  assert(
    deriveConnectivityState(cellularObservation) === "cellular_connected",
    "cellular must win when registered and data is available",
  );

  assert(
    deriveConnectivityState({
      ...cellularObservation,
      wifiConnected: true,
      satelliteSupported: true,
      satelliteEntitled: true,
      satelliteConnected: true,
    }) === "cellular_connected",
    "cellular must remain primary even when Wi-Fi is present",
  );

  const satelliteObservation = {
    observedAt: new Date(0).toISOString(),
    wifiConnected: false,
    cellularRegistered: false,
    cellularDataAvailable: false,
    satelliteSupported: true,
    satelliteEntitled: true,
    satelliteConnected: true,
  };
  assert(
    deriveConnectivityState(satelliteObservation) === "satellite_active",
    "satellite fallback must be observable before activation",
  );

  assert(
    deriveConnectivityState({ ...satelliteObservation, wifiConnected: true }) === "offline",
    "Wi-Fi must not make satellite look like a no-Wi-Fi fallback",
  );

  const customer = customerEntitlement("self-test");
  assert(isProductionReady(evidence, policy, funded), "complete evidence and funding must pass");
  assert(canServeCustomer(customer, policy, funded), "funded $0 customer must be serviceable");
  assert(
    canServeCustomerWithConnectivity(customer, policy, funded, cellularObservation),
    "funded $0 customer must be admitted over cellular when cellular is enabled",
  );
  assert(
    canServeCustomerWithConnectivity(customer, policy, funded, satelliteObservation),
    "funded $0 customer must be admitted over satellite when cellular is unavailable and satellite is enabled",
  );
  assert(
    !canServeCustomerWithConnectivity(
      customer,
      { ...policy, allowSatellite: false },
      funded,
      satelliteObservation,
    ),
    "satellite transport must be blocked when the admin policy disables it",
  );
  assert(
    !canServeCustomerWithConnectivity(
      customer,
      { ...policy, allowCellular: false },
      funded,
      cellularObservation,
    ),
    "cellular transport must be blocked when the admin policy disables it",
  );
  assert(
    !canServeCustomerWithConnectivity(
      customer,
      policy,
      funded,
      { ...satelliteObservation, satelliteSupported: false },
    ),
    "offline state must never be serviceable",
  );

  assert(
    !canServeCustomer(customerEntitlement("self-test", false), policy, funded),
    "inactive $0 entitlement must not be serviceable",
  );

  const shortfall: FundingPosition = { ...funded, availableMinor: 2_500 };
  assert(
    !canServeCustomer(customer, policy, shortfall),
    "funding shortfall must fail closed even when suspension behavior is disabled",
  );

  const overLimit: FundingPosition = { ...funded, projectedProviderCostMinor: 10_001 };
  assert(
    !canServeCustomer(customer, policy, overLimit),
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

  const reconciled = reconcileUsage(
    [validatedEvent, { ...validatedEvent, id: "evt-unreconciled" }],
    new Map([[validatedEvent.id, 125]]),
  );
  assert(reconciled[0]?.costStatus === "reconciled", "authoritative provider cost must reconcile");
  assert(reconciled[0]?.authoritativeCostMinor === 125, "reconciled cost must be authoritative");
  assert(reconciled[1]?.costStatus === "unreconciled", "missing authoritative cost must remain unreconciled");
  assert(reconciled[1]?.authoritativeCostMinor === null, "unreconciled cost must remain null");

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
}

void runSelfTest().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
