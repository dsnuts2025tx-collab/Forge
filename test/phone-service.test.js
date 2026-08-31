import test from "node:test";
import assert from "node:assert/strict";
import { PhoneServiceDomain } from "../src/phone-service.js";
import { createProviderAdapter, ProviderAdapterError } from "../src/provider-adapters.js";

class MemoryStorage {
  constructor() { this.data = new Map(); }
  async get(k) { return this.data.get(k); }
  async put(k, v) { this.data.set(k, v); }
}
const domainFor = () => {
  const storage = new MemoryStorage();
  return { storage, domain: new PhoneServiceDomain({ get: async (k,f)=>{const v=await storage.get(k);return v??f}, put:(k,v)=>storage.put(k,v), append:async(k,v)=>{const a=(await storage.get(k))??[];a.push(v);return storage.put(k,a)} }) };
};
const liveProvider = (provider) => ({
  ...provider,
  state: "LIVE",
  live: true,
  authorization: "VERIFIED",
  integrationId: "integration-test",
  credentialRef: "runtime-secret-ref",
  agreementId: "agreement-test",
  verificationEvidenceRef: "verification-test",
  supportedDeviceProfiles: ["default"]
});

test("customer enrollment persists a $0 entitlement", async () => {
  const { domain } = domainFor();
  const customer = await domain.createCustomer({ name: "Test", device: { cellular: true } });
  const entitlement = await domain.enroll(customer.id);
  assert.equal(entitlement.plan, "basic-free");
  assert.equal(entitlement.price, 0);
  assert.equal(entitlement.state, "active");
});

test("connectivity never requires Wi-Fi and does not fake unavailable providers", async () => {
  const { domain } = domainFor();
  const customer = await domain.createCustomer({ name: "Test", device: { cellular: true, satellite: true } });
  await domain.enroll(customer.id);
  const status = await domain.selectConnectivity(customer.id, { cellular: true, satellite: true });
  assert.equal(status.wifiRequired, false);
  assert.equal(status.path, "unavailable");
  assert.equal(status.reason, "no_authorized_provider");
});

test("live cellular is preferred over live satellite when voice and SMS are available", async () => {
  const { domain } = domainFor();
  const customer = await domain.createCustomer({ name: "Test", device: { cellular: true, satellite: true, profile: "default" } });
  await domain.enroll(customer.id);
  await domain.providers.set(liveProvider({ id: "cell", type: "cellular", capabilities: ["voice", "sms", "data"] }));
  await domain.providers.set(liveProvider({ id: "sat", type: "satellite", capabilities: ["emergency", "sms"] }));
  const status = await domain.selectConnectivity(customer.id, customer.device);
  assert.equal(status.path, "cellular");
  assert.equal(status.providerId, "cell");
  assert.equal(status.wifiRequired, false);
});

test("LIVE provider state requires verified authorization, integration, credentials, agreement, verification evidence, and device compatibility", async () => {
  const { domain } = domainFor();
  await assert.rejects(() => domain.providers.set({ id: "unverified", type: "cellular", state: "LIVE", live: true, capabilities: ["voice", "sms"] }), /provider_authorization_required/);
  await assert.rejects(() => domain.providers.set({ id: "no-integration", type: "cellular", state: "LIVE", live: true, authorization: "VERIFIED", capabilities: ["voice", "sms"] }), /provider_integration_required/);
  await assert.rejects(() => domain.providers.set({ id: "no-credentials", type: "cellular", state: "LIVE", live: true, authorization: "VERIFIED", integrationId: "i", capabilities: ["voice", "sms"] }), /provider_credentials_required/);
  await assert.rejects(() => domain.providers.set({ id: "no-agreement", type: "cellular", state: "LIVE", live: true, authorization: "VERIFIED", integrationId: "i", credentialRef: "r", capabilities: ["voice", "sms"] }), /provider_agreement_required/);
  await assert.rejects(() => domain.providers.set({ id: "no-verification", type: "cellular", state: "LIVE", live: true, authorization: "VERIFIED", integrationId: "i", credentialRef: "r", agreementId: "a", capabilities: ["voice", "sms"] }), /provider_verification_evidence_required/);
  await assert.rejects(() => domain.providers.set({ id: "no-device", type: "cellular", state: "LIVE", live: true, authorization: "VERIFIED", integrationId: "i", credentialRef: "r", agreementId: "a", verificationEvidenceRef: "v", capabilities: ["voice", "sms"] }), /provider_device_compatibility_required/);
});

test("cellular provider without voice/SMS is rejected instead of being presented as phone service", async () => {
  const { domain } = domainFor();
  const customer = await domain.createCustomer({ name: "Test", device: { cellular: true, satellite: false } });
  await domain.enroll(customer.id);
  await domain.providers.set(liveProvider({ id: "data-only", type: "cellular", capabilities: ["data"] }));
  const status = await domain.selectConnectivity(customer.id, customer.device);
  assert.equal(status.path, "unavailable");
  assert.equal(status.reason, "no_authorized_provider");
});

test("satellite is selected only as fallback when cellular is unavailable", async () => {
  const { domain } = domainFor();
  const customer = await domain.createCustomer({ name: "Test", device: { cellular: true, satellite: true, profile: "default" } });
  await domain.enroll(customer.id);
  await domain.providers.set(liveProvider({ id: "sat", type: "satellite", capabilities: ["emergency", "sms"] }));
  const status = await domain.selectConnectivity(customer.id, customer.device);
  assert.equal(status.path, "satellite");
  assert.equal(status.providerId, "sat");
});

test("customer usage is returned from the persistent usage ledger", async () => {
  const { domain } = domainFor();
  await domain.addUsage({ customerId: "cus_test", providerId: "p1", eventType: "data", cost: 10 });
  await domain.addUsage({ customerId: "other", providerId: "p1", eventType: "sms", cost: 1 });
  const usage = await domain.getUsage("cus_test");
  assert.equal(usage.length, 1);
  assert.equal(usage[0].cost, 10);
});

test("funding coverage reports a shortfall", async () => {
  const { domain } = domainFor();
  await domain.addUsage({ customerId: "cus_test", providerId: "p1", eventType: "data", cost: 10 });
  await domain.setFunding({ committed: 4, received: 0, allocated: 0 });
  const coverage = await domain.accounting();
  assert.equal(coverage.expectedCost, 10);
  assert.equal(coverage.shortfall, 6);
});

test("provider adapter contract refuses to impersonate a non-live provider", async () => {
  const adapter = createProviderAdapter({ id: "cell-test", type: "cellular", state: "TEST_ONLY", live: false, capabilities: ["voice", "sms"] });
  assert.equal(adapter.status().live, false);
  await assert.rejects(() => adapter.health(), (error) => error instanceof ProviderAdapterError && error.code === "provider_not_live");
});

test("provider adapter exposes readiness without exposing secrets", async () => {
  const adapter = createProviderAdapter({ id: "cell-live", type: "cellular", state: "LIVE", live: true, authorization: "VERIFIED", integrationId: "integration-test", credentialRef: "runtime-secret-ref", agreementId: "agreement-test", supportedDeviceProfiles: ["default"], capabilities: ["voice", "sms", "data"] });
  assert.equal(adapter.status().live, true);
  assert.equal(adapter.status().credentialConfigured, true);
  assert.equal(adapter.status().agreementConfigured, true);
  assert.deepEqual(adapter.status().supportedDeviceProfiles, ["default"]);
  assert.equal("credentialRef" in adapter.status(), false);
  const health = await adapter.health();
  assert.equal(health.ok, true);
  await assert.rejects(() => adapter.provision(), (error) => error.code === "provisioning_not_implemented");
});
