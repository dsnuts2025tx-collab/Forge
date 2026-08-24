/**
 * Phantom-controlled durable persistence boundary for Mission Graph state.
 *
 * Mission execution is durable work, not an in-memory convenience. This
 * boundary keeps persistence implementation replaceable while ensuring a
 * restored mission is validated before Mastermind trusts it.
 */

import {
  validateMissionGraph,
  type MissionGraph,
  type MissionNodeStatus,
} from './mission-graph';

export interface MissionGraphSnapshot {
  version: 1;
  graph: MissionGraph;
}

export interface MissionGraphPersistence {
  save(snapshot: MissionGraphSnapshot): void;
  load(): MissionGraphSnapshot | undefined;
}

function cloneGraph(graph: MissionGraph): MissionGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      dependsOn: [...node.dependsOn],
    })),
  };
}

function assertStatus(status: MissionNodeStatus, nodeId: string): void {
  if (!['PENDING', 'READY', 'RUNNING', 'SUCCEEDED', 'FAILED', 'BLOCKED'].includes(status)) {
    throw new Error(`Invalid mission node status: ${nodeId}`);
  }
}

function verifySnapshot(snapshot: MissionGraphSnapshot): void {
  if (snapshot.version !== 1) {
    throw new Error(`Unsupported mission graph snapshot version: ${snapshot.version}`);
  }

  const graph = validateMissionGraph(snapshot.graph);
  if (graph.nodes.length === 0) {
    throw new Error('Mission graph must contain at least one node');
  }

  for (const node of graph.nodes) {
    assertStatus(node.status, node.id);
    if (!Number.isInteger(node.attempt) || node.attempt < 0) {
      throw new Error(`Mission node attempt must be a non-negative integer: ${node.id}`);
    }
    if (node.status === 'SUCCEEDED' && node.failureReason) {
      throw new Error(`Succeeded mission node cannot retain a failure reason: ${node.id}`);
    }
    if (node.status === 'FAILED' && !node.failureReason?.trim()) {
      throw new Error(`Failed mission node requires a failure reason: ${node.id}`);
    }
  }
}

export function verifyMissionGraphSnapshot(snapshot: MissionGraphSnapshot): void {
  verifySnapshot(snapshot);
}

export function serializeMissionGraphSnapshot(snapshot: MissionGraphSnapshot): string {
  verifySnapshot(snapshot);
  const graph = cloneGraph(snapshot.graph);
  graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify({ version: 1, graph });
}

export function deserializeMissionGraphSnapshot(serialized: string): MissionGraphSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error('Mission graph snapshot is not valid JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Mission graph snapshot must be an object');
  }

  const snapshot = parsed as MissionGraphSnapshot;
  verifySnapshot(snapshot);
  return {
    version: 1,
    graph: cloneGraph(snapshot.graph),
  };
}

export class MissionGraphStore {
  private current?: MissionGraphSnapshot;

  constructor(private readonly persistence: MissionGraphPersistence) {
    const restored = persistence.load();
    if (restored) {
      verifySnapshot(restored);
      this.current = {
        version: 1,
        graph: cloneGraph(restored.graph),
      };
    }
  }

  save(graph: MissionGraph): void {
    const snapshot: MissionGraphSnapshot = {
      version: 1,
      graph: cloneGraph(graph),
    };
    verifySnapshot(snapshot);
    this.persistence.save({
      version: 1,
      graph: cloneGraph(snapshot.graph),
    });
    this.current = {
      version: 1,
      graph: cloneGraph(snapshot.graph),
    };
  }

  load(): MissionGraph | undefined {
    const snapshot = this.persistence.load();
    if (!snapshot) return undefined;
    verifySnapshot(snapshot);
    this.current = {
      version: 1,
      graph: cloneGraph(snapshot.graph),
    };
    return cloneGraph(snapshot.graph);
  }

  reload(): MissionGraph | undefined {
    return this.load();
  }

  currentGraph(): MissionGraph | undefined {
    return this.current ? cloneGraph(this.current.graph) : undefined;
  }

  verifyCurrent(): void {
    if (!this.current) throw new Error('No mission graph is currently loaded');
    verifySnapshot(this.current);
  }

  serialized(): string | undefined {
    return this.current ? serializeMissionGraphSnapshot(this.current) : undefined;
  }
}

export class InMemoryMissionGraphPersistence implements MissionGraphPersistence {
  private snapshot?: MissionGraphSnapshot;

  save(snapshot: MissionGraphSnapshot): void {
    verifySnapshot(snapshot);
    this.snapshot = {
      version: 1,
      graph: cloneGraph(snapshot.graph),
    };
  }

  load(): MissionGraphSnapshot | undefined {
    return this.snapshot
      ? {
          version: 1,
          graph: cloneGraph(this.snapshot.graph),
        }
      : undefined;
  }
}
