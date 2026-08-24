/**
 * Phantom Mastermind durable mission runtime.
 *
 * This is the bridge between the Mission Graph control kernel and the
 * canonical audit/persistence boundaries. Each state transition is persisted
 * before the runtime advances, and every consequential transition is audited.
 */

import {
  markMissionNodeFailed,
  markMissionNodeRunning,
  markMissionNodeSucceeded,
  missionIsComplete,
  readyMissionNodes,
  recoverInterruptedMission,
  type MissionExecutionBoundary,
  type MissionGraph,
} from './mission-graph';
import { MissionGraphStore } from './mission-graph-store';
import {
  recordMissionCompleted,
  recordMissionNodeFailed,
  recordMissionNodeStarted,
  recordMissionNodeSucceeded,
  recordMissionRecovered,
  recordMissionStarted,
  type MastermindAuditSink,
  type MastermindControlAuditContext,
} from './mastermind-audit';

export type MissionRuntimeStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'BLOCKED';

export interface MissionRuntimeResult {
  graph: MissionGraph;
  status: MissionRuntimeStatus;
  completedNodes: string[];
  failedNodes: string[];
  recoveredNodeIds: string[];
}

export class MastermindMissionRuntime {
  constructor(
    private readonly store: MissionGraphStore,
    private readonly audit: MastermindAuditSink,
  ) {}

  async execute(
    initialGraph: MissionGraph,
    boundary: MissionExecutionBoundary,
    context: MastermindControlAuditContext,
  ): Promise<MissionRuntimeResult> {
    let graph = this.store.currentGraph() ?? initialGraph;
    const recovery = recoverInterruptedMission(graph);
    graph = recovery.graph;
    this.store.save(graph);
    if (recovery.recoveredNodeIds.length > 0) {
      recordMissionRecovered(this.audit, graph, recovery.recoveredNodeIds, context);
    } else {
      recordMissionStarted(this.audit, graph, context);
    }

    const completedNodes: string[] = [];
    const failedNodes: string[] = [];

    while (true) {
      const ready = readyMissionNodes(graph);
      if (ready.length === 0) {
        if (missionIsComplete(graph)) {
          recordMissionCompleted(this.audit, graph, 'SUCCEEDED', context);
          return { graph, status: 'SUCCEEDED', completedNodes, failedNodes, recoveredNodeIds: recovery.recoveredNodeIds };
        }

        const hasFailed = graph.nodes.some((node) => node.status === 'FAILED');
        const status: MissionRuntimeStatus = hasFailed ? 'FAILED' : 'BLOCKED';
        recordMissionCompleted(this.audit, graph, 'FAILED', context);
        return { graph, status, completedNodes, failedNodes, recoveredNodeIds: recovery.recoveredNodeIds };
      }

      for (const candidate of ready) {
        graph = markMissionNodeRunning(graph, candidate.id);
        this.store.save(graph);
        const running = graph.nodes.find((node) => node.id === candidate.id);
        if (!running) throw new Error(`Mission node disappeared: ${candidate.id}`);
        recordMissionNodeStarted(this.audit, running, context);

        try {
          const result = await boundary.run({ ...candidate, status: 'RUNNING', attempt: running.attempt });
          graph = markMissionNodeSucceeded(graph, candidate.id, result.outputRef);
          this.store.save(graph);
          const succeeded = graph.nodes.find((node) => node.id === candidate.id);
          if (!succeeded) throw new Error(`Mission node disappeared after success: ${candidate.id}`);
          completedNodes.push(candidate.id);
          recordMissionNodeSucceeded(this.audit, succeeded, context);
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          graph = markMissionNodeFailed(graph, candidate.id, reason);
          this.store.save(graph);
          const failed = graph.nodes.find((node) => node.id === candidate.id);
          if (!failed) throw new Error(`Mission node disappeared after failure: ${candidate.id}`);
          failedNodes.push(candidate.id);
          recordMissionNodeFailed(this.audit, failed, context);
        }
      }
    }
  }
}
