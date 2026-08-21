import { PhoneServiceDomain, PhoneServiceStore } from "./phone-service.js";

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const cors = (response) => { const h = new Headers(response.headers); h.set("access-control-allow-origin", "*"); h.set("access-control-allow-methods", "GET,POST,OPTIONS"); h.set("access-control-allow-headers", "content-type,authorization,x-admin-token,x-idempotency-key"); return new Response(response.body, { status: response.status, headers: h }); };
const auth = (request, env, admin = false) => { if (!admin) return true; const token = request.headers.get("x-admin-token"); return !!env.ADMIN_TOKEN && token === env.ADMIN_TOKEN; };

export class PhoneServiceDO {
  constructor(state) { this.state = state; this.store = new PhoneServiceStore(state.storage); this.domain = new PhoneServiceDomain(this.store); }
  async fetch(request) {
    try {
      if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
      const url = new URL(request.url); const path = url.pathname;
      if (request.method === "GET" && path === "/health") return cors(json({ ok: true, service: "free-phone-service", wifiRequired: false, at: new Date().toISOString() }));
      if (request.method === "POST" && path === "/phone/v1/customers") return cors(json(await this.domain.createCustomer(await request.json()), 201));
      const customerMatch = path.match(/^\/phone\/v1\/customers\/([^/]+)(?:\/(enroll|connectivity|usage))?$/);
      if (customerMatch) {
        const [, customerId, action] = customerMatch;
        if (request.method === "GET" && !action) return cors(json({ customer: await this.domain.getCustomer(customerId), entitlement: await this.store.get(`entitlement:${customerId}`, null), connectivity: await this.domain.getStatus(customerId) }));
        if (request.method === "POST" && action === "enroll") return cors(json(await this.domain.enroll(customerId)));
        if (request.method === "GET" && action === "connectivity") return cors(json(await this.domain.getStatus(customerId)));
        if (request.method === "POST" && action === "connectivity") return cors(json(await this.domain.selectConnectivity(customerId, (await this.domain.getCustomer(customerId))?.device || {})));
        if (request.method === "GET" && action === "usage") return cors(json(await this.store.get("usage", []))); 
      }
      if (path === "/phone/v1/providers" && request.method === "GET") return cors(json(await this.domain.providers.list()));
      if (path === "/phone/v1/usage/events" && request.method === "POST") return cors(json(await this.domain.addUsage(await request.json()), 201));
      if (path === "/phone/v1/accounting/coverage" && request.method === "GET") return cors(json(await this.domain.accounting()));
      if (path === "/phone/v1/accounting/funding" && request.method === "POST") return cors(json(await this.domain.setFunding(await request.json())));
      if (path === "/phone/v1/admin/audit" && request.method === "GET") return auth(request, this.env, true) ? cors(json(await this.domain.audit())) : cors(json({ error: "unauthorized" }, 401));
      return cors(json({ error: "not_found" }, 404));
    } catch (error) { return cors(json({ error: error?.message || "internal_error" }, 400)); }
  }
}

export default { async fetch(request, env) { const id = env.PHONE_SERVICE.idFromName("primary"); const stub = env.PHONE_SERVICE.get(id); return stub.fetch(request); } };
