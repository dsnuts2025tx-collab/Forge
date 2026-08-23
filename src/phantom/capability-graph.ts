/**
 * Phantom Capability Graph control kernel.
 *
 * Maintains the reusable relationships Mastermind needs to reason about
 * capabilities as durable platform assets instead of one-off tasks.
 *
 * This module is deliberately provider-neutral. Persistence, infrastructure,
 * workers, and external services remain injected boundaries.
 */

export type CapabilityNodeKind =
  | 'capability'
  | 'worker'
  | 'infrastructure'
  | 'service'
  | 'api'
  | 'workflow'
  | 'data'
  | 'policy'
  | 'dependency'
  | 'recovery';

export interface CapabilityGraphNode {
  id: string;
  kind: CapabilityNodeKind;
  name: string;
  version: string;
  reliability?: number;
  costClass?: string;
  reproducible?: boolean;
  authorizationRequired?: boolean;
  proofCriteria?: string[];
  metadata?: Record<string, string>;
}

export interface CapabilityGraphEdge {
  from: string;
  to: string;
  relationship:
    | 'DEPENDS_ON'
    | 'PROVIDES'
    | 'USES'
    | 'IMPLEMENTS'
    | 'OBSERVES'
    | 'RECOVERS'
    | 'GOVERNED_BY'
    | 'PROVEN_BY';
}

export interface CapabilityGraphSnapshot {
  version: 1;
  nodes: CapabilityGraphNode[];
  edges: CapabilityGraphEdge[];
}

export class CapabilityGraph {
  private readonly nodes = new Map<string, CapabilityGraphNode>();
  private readonly edges = new Map<string, CapabilityGraphEdge>();

  upsertNode(node: CapabilityGraphNode): void {
    if (!node.id.trim()) throw new Error('Capability graph node id is required');
    if (!node.name.trim()) throw new Error(`Capability graph node name is required: ${node.id}`);
    if (!node.version.trim()) throw new Error(`Capability graph node version is required: ${node.id}`);
    if (node.reliability !== undefined && (node.reliability < 0 || node.reliability > 1)) {
      throw new Error(`Capability graph reliability must be between 0 and 1: ${node.id}`);
    }

    this.nodes.set(node.id, {
      ...node,
      proofCriteria: node.proofCriteria ? [...node.proofCriteria] : undefined,
      metadata: node.metadata ? { ...node.metadata } : undefined,
    });
  }

  link(edge: CapabilityGraphEdge): void {
    if (!this.nodes.has(edge.from)) throw new Error(`Unknown capability graph source node: ${edge.from}`);
    if (!this.nodes.has(edge.to)) throw new Error(`Unknown capability graph target node: ${edge.to}`);
    if (edge.from === edge.to) throw new Error(`Capability graph self-link is not allowed: ${edge.from}`);

    const key = `${edge.from}|${edge.relationship}|${edge.to}`;
    this.edges.set(key, { ...edge });
  }

  getNode(id: string): CapabilityGraphNode | undefined {
    const node = this.nodes.get(id);
    return node
      ? { ...node, proofCriteria: node.proofCriteria ? [...node.proofCriteria] : undefined, metadata: node.metadata ? { ...node.metadata } : undefined }
      : undefined;
  }

  related(id: string): CapabilityGraphEdge[] {
    return [...this.edges.values()]
      .filter((edge) => edge.from === id || edge.to === id)
      .map((edge) => ({ ...edge }));
  }

  reusableCapabilities(): CapabilityGraphNode[] {
    return [...this.nodes.values()]
      .filter((node) => node.kind === 'capability' && node.reproducible === true)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((node) => ({
        ...node,
        proofCriteria: node.proofCriteria ? [...node.proofCriteria] : undefined,
        metadata: node.metadata ? { ...node.metadata } : undefined,
      }));
  }

  snapshot(): CapabilityGraphSnapshot {
    return {
      version: 1,
      nodes: [...this.nodes.values()]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((node) => ({
          ...node,
          proofCriteria: node.proofCriteria ? [...node.proofCriteria] : undefined,
          metadata: node.metadata ? { ...node.metadata } : undefined,
        })),
      edges: [...this.edges.values()]
        .sort((a, b) => `${a.from}|${a.relationship}|${a.to}`.localeCompare(`${b.from}|${b.relationship}|${b.to}`))
        .map((edge) => ({ ...edge })),
    };
  }

  static fromSnapshot(snapshot: CapabilityGraphSnapshot): CapabilityGraph {
    if (snapshot.version !== 1) throw new Error(`Unsupported capability graph version: ${snapshot.version}`);
    const graph = new CapabilityGraph();
    for (const node of snapshot.nodes) graph.upsertNode(node);
    for (const edge of snapshot.edges) graph.link(edge);
    return graph;
  }
}
