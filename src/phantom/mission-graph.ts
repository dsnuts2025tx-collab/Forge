/**
 * Phantom mission graph control kernel.
 *
 * Master Mind owns mission semantics while workers execute individual nodes.
 * The graph is deliberately provider-neutral: workers, inference engines, and
 * external services remain injected boundaries. A node cannot become ready
 * until every dependency has reached a terminal success state.
 */

export type MissionNodeStatus =
  | 'PENDING'
  | 'READY'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'BLOCKED';

export interface MissionNode {
  id: string;
  capability: string;
  dependsOn: string[];
  status: MissionNodeStatus;
  attempt: number;
  outputRef?: string;
  failureReason?: string;
}

export interface MissionGraph {
  id: string;
  objective: string;
  nodes: MissionNode[];
}

export interface MissionExecutionBoundary {
  run(node: MissionNode): Promise<{ outputRef?: string }>;
}

const TERMINAL_SUCCESS: MissionNodeStatus = 'SUCCEEDED';

function cloneNode(node: MissionNode): MissionNode {
  return { ...node, dependsOn: [...node.dependsOn] };
}

function assertGraph(graph: MissionGraph): void {
  if (!graph.id || !graph.objective) throw new Error('Mission identity and objective are required');
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (!node.id || ids.has(node.id)) throw new Error(`Duplicate or empty mission node id: ${node.id}`);
    ids.add(node.id);
  }
  for (const node of graph.nodes) {
    for (const dependency of node.dependsOn) {
      if (!ids.has(dependency)) throw new Error(`Unknown mission dependency: ${dependency}`);
      if (dependency === node.id) throw new Error(`Mission node cannot depend on itself: ${node.id}`);
    }
  }
}

function hasDependencyCycle(graph: MissionGraph): boolean {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of nodes.get(id)?.dependsOn ?? []) {
      if (visit(dependency)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  return graph.nodes.some((node) => visit(node.id));
}

export function validateMissionGraph(graph: MissionGraph): MissionGraph {
  assertGraph(graph);
  if (hasDependencyCycle(graph)) throw new Error('Mission graph contains a dependency cycle');
  return {
    ...graph,
    nodes: graph.nodes.map(cloneNode),
  };
}

export function readyMissionNodes(graph: MissionGraph): MissionNode[] {
  const valid = validateMissionGraph(graph);
  const byId = new Map(valid.nodes.map((node) => [node.id, node]));
  return valid.nodes
    .filter((node) => node.status === 'PENDING' || node.status === 'BLOCKED')
    .filter((node) => node.dependsOn.every((dependency) => byId.get(dependency)?.status === TERMINAL_SUCCESS))
    .map((node) => ({ ...cloneNode(node), status: 'READY' }));
}

export function markMissionNodeRunning(graph: MissionGraph, nodeId: string): MissionGraph {
  const next = validateMissionGraph(graph);
  const node = next.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Unknown mission node: ${nodeId}`);
  if (node.status !== 'READY') throw new Error(`Mission node is not ready: ${nodeId}`);
  node.status = 'RUNNING';
  node.attempt += 1;
  return next;
}

export function markMissionNodeSucceeded(
  graph: MissionGraph,
  nodeId: string,
  outputRef?: string,
): MissionGraph {
  const next = validateMissionGraph(graph);
  const node = next.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Unknown mission node: ${nodeId}`);
  if (node.status !== 'RUNNING') throw new Error(`Mission node is not running: ${nodeId}`);
  node.status = 'SUCCEEDED';
  if (outputRef) node.outputRef = outputRef;
  node.failureReason = undefined;
  return next;
}

export function markMissionNodeFailed(
  graph: MissionGraph,
  nodeId: string,
  reason: string,
): MissionGraph {
  const next = validateMissionGraph(graph);
  const node = next.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Unknown mission node: ${nodeId}`);
  if (node.status !== 'RUNNING') throw new Error(`Mission node is not running: ${nodeId}`);
  node.status = 'FAILED';
  node.failureReason = reason;
  return next;
}

export async function executeReadyMissionNodes(
  graph: MissionGraph,
  boundary: MissionExecutionBoundary,
): Promise<MissionGraph> {
  let current = validateMissionGraph(graph);
  for (const candidate of readyMissionNodes(current)) {
    current = markMissionNodeRunning(current, candidate.id);
    try {
      const result = await boundary.run(cloneNode(candidate));
      current = markMissionNodeSucceeded(current, candidate.id, result.outputRef);
    } catch (error) {
      current = markMissionNodeFailed(
        current,
        candidate.id,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  return current;
}

export function missionIsComplete(graph: MissionGraph): boolean {
  const valid = validateMissionGraph(graph);
  return valid.nodes.length > 0 && valid.nodes.every((node) => node.status === 'SUCCEEDED');
}
