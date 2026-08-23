/**
 * Phantom Active Capability Registry.
 *
 * Records only capabilities that have passed the activation gates. The registry
 * is deliberately independent from infrastructure and external providers so
 * Mastermind can distinguish a capability that merely exists in the graph from
 * one that is actually verified and active.
 */

export interface ActiveCapabilityRecord {
  capabilityId: string;
  manifestId: string;
  activatedAt: string;
  proofId: string;
  authorizationId: string;
}

export interface ActiveCapabilityRegistrySnapshot {
  version: 1;
  records: ActiveCapabilityRecord[];
}

export interface ActiveCapabilityPersistence {
  load(): ActiveCapabilityRegistrySnapshot | undefined;
  save(snapshot: ActiveCapabilityRegistrySnapshot): void;
}

function validTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function cloneRecord(record: ActiveCapabilityRecord): ActiveCapabilityRecord {
  return { ...record };
}

function validateSnapshot(snapshot: ActiveCapabilityRegistrySnapshot): void {
  if (snapshot.version !== 1) throw new Error(`Unsupported active capability registry version: ${snapshot.version}`);

  const ids = new Set<string>();
  for (const record of snapshot.records) {
    if (!record.capabilityId.trim()) throw new Error('Active capability id is required');
    if (!record.manifestId.trim()) throw new Error(`Active capability manifest id is required: ${record.capabilityId}`);
    if (!record.proofId.trim()) throw new Error(`Active capability proof id is required: ${record.capabilityId}`);
    if (!record.authorizationId.trim()) throw new Error(`Active capability authorization id is required: ${record.capabilityId}`);
    if (!validTimestamp(record.activatedAt)) throw new Error(`Active capability timestamp is invalid: ${record.capabilityId}`);
    if (ids.has(record.capabilityId)) throw new Error(`Duplicate active capability: ${record.capabilityId}`);
    ids.add(record.capabilityId);
  }
}

export class ActiveCapabilityRegistry {
  private readonly records = new Map<string, ActiveCapabilityRecord>();

  constructor(persistence?: ActiveCapabilityPersistence) {
    const snapshot = persistence?.load();
    if (snapshot) {
      validateSnapshot(snapshot);
      for (const record of snapshot.records) this.records.set(record.capabilityId, cloneRecord(record));
    }
  }

  activate(record: ActiveCapabilityRecord, persistence?: ActiveCapabilityPersistence): void {
    validateSnapshot({ version: 1, records: [record] });
    const existing = this.records.get(record.capabilityId);
    if (existing && existing.proofId !== record.proofId) {
      throw new Error(`Active capability already registered with different proof: ${record.capabilityId}`);
    }
    this.records.set(record.capabilityId, cloneRecord(record));
    persistence?.save(this.snapshot());
  }

  deactivate(
    capabilityId: string,
    authorization: { authorized: boolean; authorizationId: string; actor: string; reason: string },
    persistence?: ActiveCapabilityPersistence,
  ): boolean {
    if (!authorization.authorized || !authorization.authorizationId || !authorization.actor || !authorization.reason) {
      throw new Error(`Explicit authorization is required to deactivate capability: ${capabilityId}`);
    }
    const existed = this.records.delete(capabilityId);
    if (existed) persistence?.save(this.snapshot());
    return existed;
  }

  isActive(capabilityId: string): boolean {
    return this.records.has(capabilityId);
  }

  get(capabilityId: string): ActiveCapabilityRecord | undefined {
    const record = this.records.get(capabilityId);
    return record ? cloneRecord(record) : undefined;
  }

  list(): ActiveCapabilityRecord[] {
    return [...this.records.values()]
      .sort((a, b) => a.capabilityId.localeCompare(b.capabilityId))
      .map(cloneRecord);
  }

  snapshot(): ActiveCapabilityRegistrySnapshot {
    const snapshot = {
      version: 1 as const,
      records: this.list(),
    };
    validateSnapshot(snapshot);
    return snapshot;
  }

  verify(): void {
    validateSnapshot(this.snapshot());
  }

  static fromSnapshot(snapshot: ActiveCapabilityRegistrySnapshot): ActiveCapabilityRegistry {
    validateSnapshot(snapshot);
    const registry = new ActiveCapabilityRegistry();
    for (const record of snapshot.records) registry.records.set(record.capabilityId, cloneRecord(record));
    return registry;
  }
}
