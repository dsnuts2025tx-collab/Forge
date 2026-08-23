/**
 * Phantom Mastermind active capability registry.
 *
 * Bridges proof-gated activation with the reusable Capability Graph. Only a
 * successfully activated capability may enter the active inventory. The
 * registry is provider-neutral and persists through an injected Phantom-owned
 * store boundary.
 */

import {
  activateCapability,
  capabilityActivationSucceeded,
  type CapabilityActivationAuthorization,
  type CapabilityActivationProof,
  type CapabilityActivationResult,
  type CapabilityActivationSink,
} from './capability-activation';
import {
  CapabilityGraph,
  type CapabilityGraphNode,
  type CapabilityGraphSnapshot,
} from './capability-graph';

export interface ActiveCapabilityRecord {
  capabilityId: string;
  manifestId: string;
  activatedAt: string;
  proofId?: string;
  authorizationId: string;
}

export interface CapabilityActivationRegistrySnapshot {
  version: 1;
  graph: CapabilityGraphSnapshot;
  active: ActiveCapabilityRecord[];
}

export interface CapabilityActivationRegistryStore {
  load(): CapabilityActivationRegistrySnapshot | undefined;
  save(snapshot: CapabilityActivationRegistrySnapshot): void;
}

function cloneRecord(record: ActiveCapabilityRecord): ActiveCapabilityRecord {
  return { ...record };
}

function validateRecord(record: ActiveCapabilityRecord): void {
  if (!record.capabilityId.trim()) throw new Error('Active capability id is required');
  if (!record.manifestId.trim()) throw new Error(`Active capability manifest is required: ${record.capabilityId}`);
  if (!record.authorizationId.trim()) throw new Error(`Active capability authorization is required: ${record.capabilityId}`);
  if (!Number.isFinite(Date.parse(record.activatedAt))) {
    throw new Error(`Active capability activation timestamp is invalid: ${record.capabilityId}`);
  }
}

function validateSnapshot(snapshot: CapabilityActivationRegistrySnapshot): void {
  if (snapshot.version !== 1) throw new Error(`Unsupported capability activation registry version: ${snapshot.version}`);
  CapabilityGraph.fromSnapshot(snapshot.graph);

  const ids = new Set<string>();
  for (const record of snapshot.active) {
    validateRecord(record);
    if (ids.has(record.capabilityId)) {
      throw new Error(`Duplicate active capability: ${record.capabilityId}`);
    }
    ids.add(record.capabilityId);

    const node = snapshot.graph.nodes.find((candidate) => candidate.id === record.capabilityId);
    if (!node || node.kind !== 'capability' || node.reproducible !== true) {
      throw new Error(`Active capability is not a reusable graph capability: ${record.capabilityId}`);
    }
  }
}

export class CapabilityActivationRegistry implements CapabilityActivationSink {
  private readonly graph: CapabilityGraph;
  private readonly active = new Map<string, ActiveCapabilityRecord>();

  constructor(private readonly store?: CapabilityActivationRegistryStore) {
    const snapshot = store?.load();
    if (snapshot) {
      validateSnapshot(snapshot);
      this.graph = CapabilityGraph.fromSnapshot(snapshot.graph);
      for (const record of snapshot.active) this.active.set(record.capabilityId, cloneRecord(record));
    } else {
      this.graph = new CapabilityGraph();
    }
  }

  registerCapability(node: CapabilityGraphNode): void {
    this.graph.upsertNode(node);
    this.persist();
  }

  activate(
    request: Parameters<typeof activateCapability>[0],
    proof: CapabilityActivationProof | undefined,
    authorization: CapabilityActivationAuthorization,
    reconciled: boolean,
    now?: string,
  ): CapabilityActivationResult {
    const node = this.graph.getNode(request.capabilityId);
    if (!node || node.kind !== 'capability') {
      throw new Error(`Capability must exist in the graph before activation: ${request.capabilityId}`);
    }

    return activateCapability(request, proof, authorization, reconciled, this, now);
  }

  record(result: CapabilityActivationResult): void {
    if (!capabilityActivationSucceeded(result)) {
      return;
    }

    const node = this.graph.getNode(result.capabilityId);
    if (!node || node.kind !== 'capability' || node.reproducible !== true) {
      throw new Error(`Only reusable graph capabilities may become active: ${result.capabilityId}`);
    }

    const authorizationId = result.authorizationId;
    if (!authorizationId) throw new Error(`Activated capability is missing authorization: ${result.capabilityId}`);

    const record: ActiveCapabilityRecord = {
      capabilityId: result.capabilityId,
      manifestId: result.manifestId,
      activatedAt: result.activatedAt!,
      proofId: result.proofId,
      authorizationId,
    };

    validateRecord(record);
    this.active.set(record.capabilityId, cloneRecord(record));
    this.persist();
  }

  isActive(capabilityId: string): boolean {
    return this.active.has(capabilityId);
  }

  getActive(capabilityId: string): ActiveCapabilityRecord | undefined {
    const record = this.active.get(capabilityId);
    return record ? cloneRecord(record) : undefined;
  }

  activeCapabilities(): ActiveCapabilityRecord[] {
    return [...this.active.values()]
      .sort((a, b) => a.capabilityId.localeCompare(b.capabilityId))
      .map(cloneRecord);
  }

  snapshot(): CapabilityActivationRegistrySnapshot {
    return {
      version: 1,
      graph: this.graph.snapshot(),
      active: this.activeCapabilities(),
    };
  }

  verify(): void {
    validateSnapshot(this.snapshot());
  }

  private persist(): void {
    const snapshot = this.snapshot();
    validateSnapshot(snapshot);
    this.store?.save(snapshot);
  }
}
