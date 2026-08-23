/**
 * Phantom-controlled durable Capability Graph integrity boundary.
 *
 * The graph is a canonical platform asset, so persisted graph state must be
 * validated before admission or restoration. The underlying storage remains an
 * injected boundary and is intentionally replaceable.
 */

import type { CapabilityGraphSnapshot } from './capability-graph';
import { CapabilityGraph } from './capability-graph';

export interface CapabilityGraphPersistence {
  load(): CapabilityGraphSnapshot | undefined;
  save(snapshot: CapabilityGraphSnapshot): void;
}

function cloneSnapshot(snapshot: CapabilityGraphSnapshot): CapabilityGraphSnapshot {
  return {
    version: snapshot.version,
    nodes: snapshot.nodes.map((node) => ({
      ...node,
      proofCriteria: node.proofCriteria ? [...node.proofCriteria] : undefined,
      metadata: node.metadata ? { ...node.metadata } : undefined,
    })),
    edges: snapshot.edges.map((edge) => ({ ...edge })),
  };
}

export function validateCapabilityGraphSnapshot(snapshot: CapabilityGraphSnapshot): void {
  if (snapshot.version !== 1) {
    throw new Error(`Unsupported capability graph version: ${snapshot.version}`);
  }

  const nodeIds = new Set<string>();
  for (const node of snapshot.nodes) {
    if (!node.id.trim()) throw new Error('Capability graph node id is required');
    if (nodeIds.has(node.id)) throw new Error(`Duplicate capability graph node: ${node.id}`);
    if (!node.name.trim()) throw new Error(`Capability graph node name is required: ${node.id}`);
    if (!node.version.trim()) throw new Error(`Capability graph node version is required: ${node.id}`);
    if (node.reliability !== undefined && (node.reliability < 0 || node.reliability > 1)) {
      throw new Error(`Capability graph reliability must be between 0 and 1: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  const edgeKeys = new Set<string>();
  for (const edge of snapshot.edges) {
    if (!nodeIds.has(edge.from)) throw new Error(`Capability graph edge references unknown source: ${edge.from}`);
    if (!nodeIds.has(edge.to)) throw new Error(`Capability graph edge references unknown target: ${edge.to}`);
    if (edge.from === edge.to) throw new Error(`Capability graph self-link is not allowed: ${edge.from}`);
    const key = `${edge.from}|${edge.relationship}|${edge.to}`;
    if (edgeKeys.has(key)) throw new Error(`Duplicate capability graph edge: ${key}`);
    edgeKeys.add(key);
  }
}

export class VerifiedCapabilityGraphStore implements CapabilityGraphPersistence {
  constructor(private readonly persistence: CapabilityGraphPersistence) {}

  load(): CapabilityGraphSnapshot | undefined {
    const snapshot = this.persistence.load();
    if (!snapshot) return undefined;
    validateCapabilityGraphSnapshot(snapshot);
    CapabilityGraph.fromSnapshot(snapshot);
    return cloneSnapshot(snapshot);
  }

  save(snapshot: CapabilityGraphSnapshot): void {
    validateCapabilityGraphSnapshot(snapshot);
    CapabilityGraph.fromSnapshot(snapshot);
    this.persistence.save(cloneSnapshot(snapshot));
  }

  verify(): void {
    const snapshot = this.load();
    if (snapshot) validateCapabilityGraphSnapshot(snapshot);
  }
}

/** Reference Phantom-controlled persistence adapter for local/test operation. */
export class InMemoryCapabilityGraphPersistence implements CapabilityGraphPersistence {
  private snapshot: CapabilityGraphSnapshot | undefined;

  load(): CapabilityGraphSnapshot | undefined {
    return this.snapshot ? cloneSnapshot(this.snapshot) : undefined;
  }

  save(snapshot: CapabilityGraphSnapshot): void {
    validateCapabilityGraphSnapshot(snapshot);
    CapabilityGraph.fromSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}
