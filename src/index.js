import { PhoneServiceDomain, PhoneServiceStore } from "./phone-service.js";

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const cors = (response) => { const h = new Headers(response.headers); h.set("access-control-allow-origin", "*"); h.set("access-control-allow-methods", "GET,POST,OPTIONS"); h.set("access-control-allow-headers", "content-type,authorization,x-admin-token,x-idempotency-key"); return new Response(response.body, { status: response.status, headers: h }); };
const adminAuth = (request, env) => !!env.ADMIN_TOKEN && request.headers.get("x-admin-token") === env.ADMIN_TOKEN;
const unauthorized = () => cors(json({ error: "unauthorized" }, 401));

const appHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Free Phone Service</title><style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 18px}button{padding:10px 14px;margin:6px 0}input{padding:10px;width:100%;box-sizing:border-box;margin:6px 0}pre{white-space:pre-wrap;background:#f5f5f5;padding:14px;border-radius:8px}.ok{font-weight:700}</style></head><body><h1>Free Phone Service</h1><p class="ok">Basic service entitlement: $0</p><p>Connectivity policy: cellular first, compatible satellite fallback. Wi-Fi is not required by the phone-service control plane.</p><input id="name" placeholder="Your name"><input id="phone" placeholder="Phone number"><input id="device" placeholder='Device capabilities, e.g. {"cellular":true,"satellite":true}' value='{"cellular":true,"satellite":true}'><button onclick="enroll()">Enroll in $0 service</button><pre id="out">Ready.</pre><script>async function enroll(){const out=document.querySelector('#out');try{const device=JSON.parse(document.querySelector('#device').value||'{}');const r=await fetch('/phone/v1/customers',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:document.querySelector('#name').value,phone:document.querySelector('#phone').value,device})});const c=await r.json();if(!r.ok)throw new Error(c.error||'Enrollment failed');const e=await fetch('/phone/v1/customers/'+c.id+'/enroll',{method:'POST'});const entitlement=await e.json();const s=await fetch('/phone/v1/customers/'+c.id+'/connectivity');const status=await s.json();out.textContent=JSON.stringify({customer:c,entitlement,connectivity:status},null,2)}catch(err){out.textContent=err.message}}</script></body></html>`;

export class PhoneServiceDO {
  constructor(state, env) { this.state = state; this.env = env; this.store = new PhoneServiceStore(state.storage); this.domain = new PhoneServiceDomain(this.store); }
  async fetch(request) {
    try {
      if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
      const url = new URL(request.url); const path = url.pathname;
      if (request.method === "GET" && path === "/") return new Response(appHtml, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      if (request.method === "GET" && path === "/health") return cors(json({ ok: true, service: "free-phone-service", wifiRequired: false, at: new Date().toISOString() }));
      if (request.method === "POST" && path === "/phone/v1/customers") return cors(json(await this.domain.createCustomer(await request.json()), 201));
      const customerMatch = path.match(/^\/phone\/v1\/customers\/([^/]+)(?:\/(enroll|connectivity|usage))?$/);
      if (customerMatch) {
        const [, customerId, action] = customerMatch;
        if (request.method === "GET" && !action) return cors(json({ customer: await this.domain.getCustomer(customerId), entitlement: await this.store.get(`entitlement:${customerId}`, null), connectivity: await this.domain.getStatus(customerId), usage: await this.domain.getUsage(customerId) }));
        if (request.method === "POST" && action === "enroll") return cors(json(await this.domain.enroll(customerId)));
        if (request.method === "GET" && action === "connectivity") return cors(json(await this.domain.getStatus(customerId)));
        if (request.method === "POST" && action === "connectivity") return cors(json(await this.domain.selectConnectivity(customerId, (await this.domain.getCustomer(customerId))?.device || {})));
        if (request.method === "GET" && action === "usage") return cors(json(await this.domain.getUsage(customerId)));
      }
      if (path === "/phone/v1/providers" && request.method === "GET") return cors(json(await this.domain.providers.list()));
      if (path === "/phone/v1/admin/providers" && request.method === "POST") return adminAuth(request, this.env) ? cors(json(await this.domain.providers.set(await request.json()))) : unauthorized();
      if (path === "/phone/v1/admin/customers" && request.method === "GET") {
        if (!adminAuth(request, this.env)) return unauthorized();
        const customerIds = await this.store.get("customers:index", []);
        const customers = await Promise.all(customerIds.map(async (id) => ({ id, customer: await this.domain.getCustomer(id), entitlement: await this.store.get(`entitlement:${id}`, null), connectivity: await this.domain.getStatus(id) })));
        return cors(json(customers));
      }
      if (path === "/phone/v1/usage/events" && request.method === "POST") return adminAuth(request, this.env) ? cors(json(await this.domain.addUsage(await request.json()), 201)) : unauthorized();
      if (path === "/phone/v1/accounting/coverage" && request.method === "GET") return cors(json(await this.domain.accounting()));
      if (path === "/phone/v1/accounting/funding" && request.method === "POST") return adminAuth(request, this.env) ? cors(json(await this.domain.setFunding(await request.json()))) : unauthorized();
      if (path === "/phone/v1/admin/audit" && request.method === "GET") return adminAuth(request, this.env) ? cors(json(await this.domain.audit())) : unauthorized();
      return cors(json({ error: "not_found" }, 404));
    } catch (error) { return cors(json({ error: error?.message || "internal_error" }, 400)); }
  }
}

export default { async fetch(request, env) { const id = env.PHONE_SERVICE.idFromName("primary"); return env.PHONE_SERVICE.get(id).fetch(request); } };
