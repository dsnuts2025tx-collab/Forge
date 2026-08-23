export const VERIFICATION_STATES = Object.freeze({ UNVERIFIED: "UNVERIFIED", VERIFIED: "VERIFIED", DEGRADED: "DEGRADED" });
export const VERIFICATION_TESTS = Object.freeze({ REGISTRATION: "registration", CALL: "call", SMS: "sms", DATA: "data", HANDOFF: "handoff", RECOVERY: "recovery" });

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;

export class VerificationError extends Error {
  constructor(code, message = code) { super(message); this.name = "VerificationError"; this.code = code; }
}

const hash = async (value) => {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

export class PhoneVerificationService {
  constructor(store) { this.store = store; }

  async verifyEvidence(input) {
    if (!input?.customerId || !input?.path) throw new VerificationError("invalid_evidence");
    if (!input.wifiDisabled) throw new VerificationError("wifi_must_be_disabled");
    if (!["cellular", "satellite"].includes(input.path)) throw new VerificationError("invalid_path");
    if (!input.providerId || !input.providerAuthorized || !input.providerLive) throw new VerificationError("live_provider_evidence_required");
    if (!input.deviceCompatible) throw new VerificationError("compatible_device_required");
    if (!Array.isArray(input.tests) || !input.tests.length) throw new VerificationError("service_tests_required");
    const failed = input.tests.filter((test) => test.result !== "PASS");
    const receipt = {
      id: id("ver"), customerId: input.customerId, deviceId: input.deviceId || null,
      providerId: input.providerId, path: input.path, wifiDisabled: true,
      providerAuthorized: true, providerLive: true, deviceCompatible: true,
      tests: input.tests, state: failed.length ? VERIFICATION_STATES.DEGRADED : VERIFICATION_STATES.VERIFIED,
      verifiedAt: now()
    };
    receipt.auditHash = await hash(receipt);
    await this.store.append("verification:receipts", receipt);
    await this.store.put(`verification:${input.customerId}`, receipt);
    return receipt;
  }

  async status(customerId) {
    return this.store.get(`verification:${customerId}`, { customerId, state: VERIFICATION_STATES.UNVERIFIED, reason: "no_verified_evidence" });
  }

  async verifyRequiredTests(input) {
    const required = input.path === "cellular"
      ? [VERIFICATION_TESTS.REGISTRATION, VERIFICATION_TESTS.CALL, VERIFICATION_TESTS.SMS, VERIFICATION_TESTS.DATA]
      : [VERIFICATION_TESTS.REGISTRATION, VERIFICATION_TESTS.SMS];
    const tests = Array.isArray(input.tests) ? input.tests : [];
    const missing = required.filter((name) => !tests.some((test) => test.type === name && test.result === "PASS"));
    if (missing.length) throw new VerificationError("required_tests_missing", missing.join(","));
    return true;
  }
}
