export const PROVIDER_STATES = Object.freeze({ PENDING: "PENDING", TEST_ONLY: "TEST_ONLY", LIVE: "LIVE", SUSPENDED: "SUSPENDED" });

export class ProviderAdapterError extends Error {
  constructor(code, message = code) { super(message); this.name = "ProviderAdapterError"; this.code = code; }
}

const liveConfigIsComplete = (config) => config?.state === PROVIDER_STATES.LIVE
  && config.live === true
  && config.authorization === "VERIFIED"
  && Boolean(config.integrationId)
  && Boolean(config.credentialRef)
  && Boolean(config.agreementId)
  && Array.isArray(config.supportedDeviceProfiles)
  && config.supportedDeviceProfiles.length > 0;

export class ProviderAdapterContract {
  constructor(config) {
    if (!config?.id || !["cellular", "satellite"].includes(config.type)) throw new ProviderAdapterError("invalid_provider");
    this.config = Object.freeze({
      ...config,
      state: config.state || PROVIDER_STATES.PENDING,
      live: liveConfigIsComplete(config)
    });
  }
  status() {
    return {
      id: this.config.id,
      type: this.config.type,
      state: this.config.state,
      live: this.config.live,
      capabilities: this.config.capabilities || [],
      integrationId: this.config.integrationId || null,
      credentialConfigured: Boolean(this.config.credentialRef),
      agreementConfigured: Boolean(this.config.agreementId),
      supportedDeviceProfiles: this.config.supportedDeviceProfiles || []
    };
  }
  assertLive() {
    if (!this.config.live || this.config.state !== PROVIDER_STATES.LIVE) throw new ProviderAdapterError("provider_not_live");
  }
  async health() { this.assertLive(); return { ok: true, providerId: this.config.id, checkedAt: new Date().toISOString() }; }
  async provision() { this.assertLive(); throw new ProviderAdapterError("provisioning_not_implemented", "Real provider provisioning requires an authorized provider implementation"); }
  async suspend() { this.assertLive(); throw new ProviderAdapterError("suspension_not_implemented", "Real provider suspension requires an authorized provider implementation"); }
  async resume() { this.assertLive(); throw new ProviderAdapterError("resume_not_implemented", "Real provider resumption requires an authorized provider implementation"); }
  async usage() { this.assertLive(); throw new ProviderAdapterError("usage_not_implemented", "Real provider usage requires an authorized provider implementation"); }
}

export const createProviderAdapter = (config) => new ProviderAdapterContract(config);
