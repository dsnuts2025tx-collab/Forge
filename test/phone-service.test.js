import test from "node:test";
import assert from "node:assert/strict";
import { PhoneServiceDomain } from "../src/phone-service.js";

class MemoryStorage {
  constructor() { this.data = new Map(); }
  async get(k) { return this.data.get(k); }
  async put(k, v) { this.data.set(k, v); }
}

test("customer enrollment persists a $0 entitlement", async () => {
  const domain = new PhoneServiceDomain(new (class { constructor(){this.s=new MemoryStorage()} async get(k,f){const v=await this.s.get(k);return v??f} async put(k,v){return this.s.put(k,v)} async append(k,v){const a=await this.get(k,[]);a.push(v);await this.put(k,a);return v} })());
  const customer = await domain.createCustomer({ name: "Test", device: { cellular: true } });
  const entitlement = await domain.enroll(customer.id);
  assert.equal(entitlement.plan, "basic-free");
  assert.equal(entitlement.price, 0);
  assert.equal(entitlement.state, "active");
});

test("connectivity never requires Wi-Fi", async () => {
  const storage = new MemoryStorage();
  const domain = new PhoneServiceDomain({ get: async (k,f)=>{const v=await storage.get(k);return v??f}, put:(k,v)=>storage.put(k,v), append:async(k,v)=>{const a=(await storage.get(k))??[];a.push(v);return storage.put(k,a)} });
  const customer = await domain.createCustomer({ name: "Test", device: { cellular: true, satellite: true } });
  await domain.enroll(customer.id);
  const status = await domain.selectConnectivity(customer.id, { cellular: true, satellite: true });
  assert.equal(status.wifiRequired, false);
  assert.equal(status.path, "unavailable");
});

test("funding coverage reports a shortfall", async () => {
  const storage = new MemoryStorage();
  const domain = new PhoneServiceDomain({ get: async (k,f)=>{const v=await storage.get(k);return v??f}, put:(k,v)=>storage.put(k,v), append:async(k,v)=>{const a=(await storage.get(k))??[];a.push(v);return storage.put(k,a)} });
  await domain.addUsage({ customerId: "cus_test", providerId: "p1", eventType: "data", cost: 10 });
  await domain.setFunding({ committed: 4, received: 0, allocated: 0 });
  const coverage = await domain.accounting();
  assert.equal(coverage.expectedCost, 10);
  assert.equal(coverage.shortfall, 6);
});
