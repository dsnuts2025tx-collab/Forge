export const PATHS = Object.freeze({ CELLULAR: "cellular", SATELLITE: "satellite", UNAVAILABLE: "unavailable" });

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const liveProviderReady = (provider) => provider?.live === true
  && provider.state === "LIVE"
  && provider.authorization === "VERIFIED"
  && Boolean(provider.integrationId)
  && Boolean(provider.credentialRef)
  && Boolean(provider.agreementId)
  && Boolean(provider.verificationEvidenceRef)
  && Array.isArray(provider.supportedDeviceProfiles)
  && provider.supportedDeviceProfiles.length > 0;

export class PhoneServiceStore {
  constructor(storage) { this.storage = storage; }
  async get(key, fallback) { const value = await this.storage.get(key); return value ?? fallback; }
  async put(key, value) { await this.storage.put(key, value); return value; }
  async append(key, value) { const list = await this.get(key, []); list.push(value); await this.put(key, list); return value; }
}

export class ProviderRegistry {
  constructor(store) { this.store = store; }
  async list() { return this.store.get("providers", [
    { id: "cellular-default", type: "cellular", state: "PENDING", capabilities: ["voice", "sms", "data"], live: false, authorization: "UNVERIFIED" },
    { id: "satellite-default", type: "satellite", state: "PENDING", capabilities: ["emergency", "sms"], live: false, authorization: "UNVERIFIED" }
  ]); }
  async set(provider) {
    const providers = await this.list();
    if (!provider?.id || !["cellular", "satellite"].includes(provider.type)) throw new Error("invalid_provider");
    if (!Array.isArray(provider.capabilities)) throw new Error("invalid_provider_capabilities");
    if (provider.live === true || provider.state === "LIVE") {
      if (provider.authorization !== "VERIFIED") throw new Error("provider_authorization_required");
      if (!provider.integrationId) throw new Error("provider_integration_required");
      if (!provider.credentialRef) throw new Error("provider_credentials_required");
      if (!provider.agreementId) throw new Error("provider_agreement_required");
      if (!provider.verificationEvidenceRef) throw new Error("provider_verification_evidence_required");
      if (!Array.isArray(provider.supportedDeviceProfiles) || provider.supportedDeviceProfiles.length === 0) throw new Error("provider_device_compatibility_required");
    }
    const next = providers.filter((p) => p.id !== provider.id).concat({ ...provider, live: liveProviderReady(provider), authorization: provider.authorization || "UNVERIFIED" });
    return this.store.put("providers", next);
  }
}

export class PhoneServiceDomain {
  constructor(store) { this.store = store; this.providers = new ProviderRegistry(store); }

  async createCustomer(input) {
    const customer = { id: id("cus"), name: input.name || "Customer", phone: input.phone || null, device: input.device || {}, createdAt: now() };
    await this.store.put(`customer:${customer.id}`, customer);
    await this.store.append("customers:index", customer.id);
    await this.store.put(`entitlement:${customer.id}`, { customerId: customer.id, plan: "basic-free", state: "pending", price: 0, currency: "USD", createdAt: now() });
    await this.store.append("audit", { id: id("aud"), action: "customer.create", target: customer.id, at: now() });
    return customer;
  }

  async getCustomer(customerId) { return this.store.get(`customer:${customerId}`, null); }

  async enroll(customerId) {
    const customer = await this.getCustomer(customerId);
    if (!customer) throw new Error("customer_not_found");
    const entitlement = { customerId, plan: "basic-free", state: "active", price: 0, currency: "USD", effectiveAt: now() };
    await this.store.put(`entitlement:${customerId}`, entitlement);
    await this.store.put(`connectivity:${customerId}`, { customerId, path: PATHS.UNAVAILABLE, reason: "no_authorized_provider", wifiRequired: false, observedAt: now() });
    await this.store.append("audit", { id: id("aud"), action: "entitlement.activate", target: customerId, at: now() });
    return entitlement;
  }

  async getStatus(customerId) { return this.store.get(`connectivity:${customerId}`, { customerId, path: PATHS.UNAVAILABLE, reason: "not_enrolled", wifiRequired: false, observedAt: now() }); }

  async selectConnectivity(customerId, device = {}) {
    const entitlement = await this.store.get(`entitlement:${customerId}`, null);
    if (!entitlement || entitlement.state !== "active" || entitlement.price !== 0) throw new Error("active_free_entitlement_required");
    const providers = await this.providers.list();
    const coverage = await this.accounting();
    if (coverage.expectedCost > 0 && coverage.coverageRatio !== null && coverage.coverageRatio < 1) return this.persistUnavailable(customerId, "funding_shortfall");
    const cellular = providers.find((p) => p.type === "cellular" && liveProviderReady(p) && p.capabilities.includes("voice") && p.capabilities.includes("sms"));
    if (cellular && device.cellular !== false && cellular.supportedDeviceProfiles.includes(device.profile || "default")) {
      const state = { customerId, path: PATHS.CELLULAR, providerId: cellular.id, reason: "authorized_cellular_available", capabilities: cellular.capabilities, wifiRequired: false, observedAt: now() };
      await this.store.put(`connectivity:${customerId}`, state); return state;
    }
    const satellite = providers.find((p) => p.type === "satellite" && liveProviderReady(p) && p.capabilities.includes("sms"));
    if (satellite && device.satellite === true && satellite.supportedDeviceProfiles.includes(device.profile || "default")) {
      const state = { customerId, path: PATHS.SATELLITE, providerId: satellite.id, reason: "authorized_satellite_fallback", capabilities: satellite.capabilities, wifiRequired: false, observedAt: now() };
      await this.store.put(`connectivity:${customerId}`, state); return state;
    }
    return this.persistUnavailable(customerId, "no_authorized_provider");
  }

  async persistUnavailable(customerId, reason) {
    const state = { customerId, path: PATHS.UNAVAILABLE, reason, wifiRequired: false, observedAt: now() };
    await this.store.put(`connectivity:${customerId}`, state);
    return state;
  }

  async getUsage(customerId) { return (await this.store.get("usage", [])).filter((event) => event.customerId === customerId); }

  async addUsage(event) {
    if (!event?.customerId || !event?.eventType || !event?.providerId) throw new Error("invalid_usage_event");
    const record = { id: id("use"), ...event, at: now() };
    await this.store.append("usage", record);
    if (event.expectedCost !== undefined || event.cost !== undefined) await this.store.append("costs", { id: id("cost"), usageId: record.id, providerId: event.providerId, expected: Number(event.expectedCost ?? event.cost) || 0, actual: null, currency: event.currency || "USD", reconciliationState: "UNRECONCILED", providerReference: event.providerReference || null, at: now() });
    return record;
  }

  async reconcileCosts(input) {
    if (!Array.isArray(input?.records) || input.records.length === 0) throw new Error("billing_records_required");
    const costs = await this.store.get("costs", []);
    const updates = new Map(input.records.filter((r) => r?.usageId && r?.providerReference).map((r) => [r.usageId, r]));
    const next = costs.map((cost) => {
      const bill = updates.get(cost.usageId);
      if (!bill) return cost;
      if (!Number.isFinite(Number(bill.actualCost)) || Number(bill.actualCost) < 0) throw new Error("invalid_authoritative_cost");
      return { ...cost, actual: Number(bill.actualCost), currency: bill.currency || cost.currency, providerReference: bill.providerReference, reconciliationState: "RECONCILED", reconciledAt: now() };
    });
    const unmatched = input.records.filter((r) => !costs.some((c) => c.usageId === r.usageId));
    if (unmatched.length) throw new Error("billing_usage_reference_unmatched");
    await this.store.put("costs", next);
    await this.store.append("audit", { id: id("aud"), action: "costs.reconcile", records: input.records.length, at: now() });
    return { reconciled: input.records.length, unreconciled: next.filter((c) => c.reconciliationState !== "RECONCILED").length, costs: next };
  }

  async accounting() {
    const costs = await this.store.get("costs", []);
    const funding = await this.store.get("funding", { committed: 0, received: 0, allocated: 0 });
    const expected = costs.reduce((sum, c) => sum + Number(c.expected || 0), 0);
    const actualReconciled = costs.filter((c) => c.reconciliationState === "RECONCILED").reduce((sum, c) => sum + Number(c.actual || 0), 0);
    const unresolved = costs.filter((c) => c.reconciliationState !== "RECONCILED").reduce((sum, c) => sum + Number(c.expected || 0), 0);
    const available = Number(funding.received || 0) + Number(funding.committed || 0) - Number(funding.allocated || 0);
    const coverageBasis = actualReconciled + unresolved;
    return { expectedCost: expected, reconciledActualCost: actualReconciled, unreconciledExpectedCost: unresolved, availableFunding: available, coverageRatio: coverageBasis ? available / coverageBasis : null, shortfall: Math.max(0, coverageBasis - available), funding, fundingSufficient: coverageBasis <= available };
  }

  async setFunding(funding) {
    for (const key of ["committed", "received", "allocated"]) if (funding[key] !== undefined && (!Number.isFinite(Number(funding[key])) || Number(funding[key]) < 0)) throw new Error("invalid_funding_amount");
    return this.store.put("funding", { ...funding, updatedAt: now() });
  }
  async audit() { return this.store.get("audit", []); }
}
