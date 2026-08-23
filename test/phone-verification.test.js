import test from "node:test";
import assert from "node:assert/strict";
import { PhoneVerificationService, VerificationError, VERIFICATION_STATES } from "../src/phone-verification.js";

class MemoryStore {
  constructor() { this.data = new Map(); }
  async get(key, fallback) { return this.data.has(key) ? this.data.get(key) : fallback; }
  async put(key, value) { this.data.set(key, value); return value; }
  async append(key, value) { const list = await this.get(key, []); list.push(value); this.data.set(key, list); return value; }
}

const cellularTests = [
  { type: "registration", result: "PASS" },
  { type: "call", result: "PASS" },
  { type: "sms", result: "PASS" },
  { type: "data", result: "PASS" }
];

test("verification requires Wi-Fi to be disabled", async () => {
  const service = new PhoneVerificationService(new MemoryStore());
  await assert.rejects(() => service.verifyEvidence({ customerId: "cus_1", path: "cellular", wifiDisabled: false }), (error) => error instanceof VerificationError && error.code === "wifi_must_be_disabled");
});

test("verification refuses unverified provider evidence", async () => {
  const service = new PhoneVerificationService(new MemoryStore());
  await assert.rejects(() => service.verifyEvidence({ customerId: "cus_1", path: "cellular", wifiDisabled: true, providerId: "p1", providerAuthorized: false, providerLive: false, deviceCompatible: true, tests: cellularTests }), (error) => error.code === "live_provider_evidence_required");
});

test("cellular verification creates a signed evidence receipt", async () => {
  const service = new PhoneVerificationService(new MemoryStore());
  const receipt = await service.verifyEvidence({ customerId: "cus_1", deviceId: "dev_1", path: "cellular", wifiDisabled: true, providerId: "carrier_1", providerAuthorized: true, providerLive: true, deviceCompatible: true, tests: cellularTests });
  assert.equal(receipt.state, VERIFICATION_STATES.VERIFIED);
  assert.equal(receipt.wifiDisabled, true);
  assert.match(receipt.auditHash, /^[0-9a-f]{64}$/);
  assert.equal((await service.status("cus_1")).state, VERIFICATION_STATES.VERIFIED);
});

test("cellular verification requires registration, call, SMS and data", async () => {
  const service = new PhoneVerificationService(new MemoryStore());
  await assert.rejects(() => service.verifyRequiredTests({ path: "cellular", tests: cellularTests.filter((test) => test.type !== "data") }), (error) => error.code === "required_tests_missing");
});

test("failed evidence is degraded rather than live", async () => {
  const service = new PhoneVerificationService(new MemoryStore());
  const receipt = await service.verifyEvidence({ customerId: "cus_2", path: "cellular", wifiDisabled: true, providerId: "carrier_1", providerAuthorized: true, providerLive: true, deviceCompatible: true, tests: [...cellularTests.slice(0, 3), { type: "data", result: "FAIL" }] });
  assert.equal(receipt.state, VERIFICATION_STATES.DEGRADED);
});
