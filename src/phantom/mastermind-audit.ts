/**
 * Phantom Mastermind canonical audit/observability boundary.
 *
 * The control plane owns event semantics and evidence shape. Durable storage,
 * telemetry, and external observability systems remain adapters behind this
 * contract so the core does not become dependent on a vendor.
 */

import type { InfrastructureRecoveryReceipt } from './infrastructure-recovery';
import type { InfrastructureControllerReceipt } from './infrastructure-controller';
import type { CapabilityHealthResult } from './capability-health';
import type { MissionGraph, MissionNode } from './mission-graph';

export type MastermindAuditEventType =
  | 'CAPABILITY_PLANNED'
  | 'CAPABILITY_PROVISIONED'
  | 'DESIRED_STATE_PERSISTED'
  | 'INFRASTRUCTURE_MUTATION'
  | 'INFRASTRUCTURE_RECOVERY'
  | 'DRIFT_DETECTED'
  | 'RECOVERY_VERIFIED'
  | 'RECOVERY_FAILED'
  | 'CAPABILITY_HEALTH_CHECKED'
  | 'CAPABILITY_REVOKED'
  | 'MISSION_STARTED'
  | 'MISSION_NODE_STARTED'
  | 'MISSION_NODE_SUCCEEDED'
  | 'MISSION_NODE_FAILED'
  | 'MISSION_COMPLETED';

export interface MastermindAuditEvent {
  id: string;
  type: MastermindAuditEventType;
  occurredAt: string;
  actor: string;
  authorizationId?: string;
  correlationId: string;
  resourceRevision?: string;
  status: 'RECORDED' | 'FAILED';
  evidence: Record<string, unknown>;
}

export interface MastermindAuditSink {
  append(event: MastermindAuditEvent): void;
  list(correlationId?: string): MastermindAuditEvent[];
}

function cloneEvent(event: MastermindAuditEvent): MastermindAuditEvent {
  return {
    ...event,
    evidence: JSON.parse(JSON.stringify(event.evidence)) as Record<string, unknown>,
  };
}

function assertEvent(event: MastermindAuditEvent): void {
  if (!event.id.trim()) throw new Error('Mastermind audit event id is required');
  if (!event.type) throw new Error('Mastermind audit event type is required');
  if (!event.occurredAt.trim() || Number.isNaN(Date.parse(event.occurredAt))) {
    throw new Error('Mastermind audit event timestamp is invalid');
  }
  if (!event.actor.trim()) throw new Error('Mastermind audit actor is required');
  if (!event.correlationId.trim()) throw new Error('Mastermind audit correlation id is required');
}

/** Phantom-controlled reference sink for tests and local control-plane operation. */
export class InMemoryMastermindAuditSink implements MastermindAuditSink {
  private readonly events: MastermindAuditEvent[] = [];

  append(event: MastermindAuditEvent): void {
    assertEvent(event);
    if (this.events.some((existing) => existing.id === event.id)) {
      throw new Error(`Duplicate Mastermind audit event id: ${event.id}`);
    }
    this.events.push(cloneEvent(event));
  }

  list(correlationId?: string): MastermindAuditEvent[] {
    return this.events
      .filter((event) => !correlationId || event.correlationId === correlationId)
      .map(cloneEvent);
  }
}

export interface MastermindRecoveryAuditContext {
  actor: string;
  correlationId: string;
}

export interface MastermindControlAuditContext extends MastermindRecoveryAuditContext {
  authorizationId?: string;
}

export function recordCapabilityPlanned(
  sink: MastermindAuditSink,
  plan: {
    manifest: { id: string; intent: string; authorizationRequired: boolean; proofCriteria: string[] };
    desiredState: { revision: string; resources: Array<{ id: string; kind: string; version: string }> };
    reconciliation: { actions: Array<{ action: string; resourceId: string }> };
  },
  context: MastermindControlAuditContext,
  occurredAt = new Date().toISOString(),
): MastermindAuditEvent {
  const event: MastermindAuditEvent = {
    id: `mastermind-plan:${context.correlationId}:${plan.manifest.id}:${occurredAt}`,
    type: 'CAPABILITY_PLANNED',
    occurredAt,
    actor: context.actor,
    authorizationId: context.authorizationId,
    correlationId: context.correlationId,
    resourceRevision: plan.desiredState.revision,
    status: 'RECORDED',
    evidence: {
      manifestId: plan.manifest.id,
      intent: plan.manifest.intent,
      authorizationRequired: plan.manifest.authorizationRequired,
      proofCriteria: [...plan.manifest.proofCriteria],
      desiredResourceIds: plan.desiredState.resources.map((resource) => ({ ...resource })),
      reconciliationActions: plan.reconciliation.actions.map((action) => ({ ...action })),
    },
  };
  sink.append(event);
  return cloneEvent(event);
}

export function recordCapabilityProvisioned(
  sink: MastermindAuditSink,
  result: { manifestId: string; missingCapabilityWork: boolean; infrastructureApplied: boolean; infrastructureVerified: boolean; activationStatus: string; registered: boolean },
  context: MastermindControlAuditContext,
  resourceRevision: string,
  occurredAt = new Date().toISOString(),
): MastermindAuditEvent {
  const event: MastermindAuditEvent = {
    id: `mastermind-provision:${context.correlationId}:${result.manifestId}:${occurredAt}`,
    type: 'CAPABILITY_PROVISIONED',
    occurredAt,
    actor: context.actor,
    authorizationId: context.authorizationId,
    correlationId: context.correlationId,
    resourceRevision,
    status: result.registered ? 'RECORDED' : 'FAILED',
    evidence: { ...result },
  };
  sink.append(event);
  return cloneEvent(event);
}

export function recordDesiredStatePersisted(
  sink: MastermindAuditSink,
  state: { revision: string; version: string; resources: Array<{ id: string; kind: string; version: string }> },
  context: MastermindControlAuditContext,
  occurredAt = new Date().toISOString(),
): MastermindAuditEvent {
  const event: MastermindAuditEvent = {
    id: `mastermind-desired-state:${context.correlationId}:${state.revision}:${occurredAt}`,
    type: 'DESIRED_STATE_PERSISTED',
    occurredAt,
    actor: context.actor,
    authorizationId: context.authorizationId,
    correlationId: context.correlationId,
    resourceRevision: state.revision,
    status: 'RECORDED',
    evidence: {
      desiredStateVersion: state.version,
      resourceIds: state.resources.map((resource) => ({ ...resource })),
    },
  };
  sink.append(event);
  return cloneEvent(event);
}

export function recordInfrastructureMutation(
  sink: MastermindAuditSink,
  receipt: InfrastructureControllerReceipt,
  context: MastermindControlAuditContext,
  occurredAt = receipt.appliedAt,
): MastermindAuditEvent {
  const failed = receipt.results.some((result) => result.status === 'FAILED');
  const event: MastermindAuditEvent = {
    id: `mastermind-mutation:${context.correlationId}:${receipt.authorizationId}:${receipt.appliedAt}`,
    type: 'INFRASTRUCTURE_MUTATION',
    occurredAt,
    actor: context.actor,
    authorizationId: receipt.authorizationId,
    correlationId: context.correlationId,
    resourceRevision: receipt.desiredRevision,
    status: failed ? 'FAILED' : 'RECORDED',
    evidence: {
      controllerVersion: receipt.controllerVersion,
      desiredRevision: receipt.desiredRevision,
      results: receipt.results.map((result) => ({ ...result })),
      actualState: receipt.actualState,
    },
  };
  sink.append(event);
  return cloneEvent(event);
}

export function recordInfrastructureRecovery(
  sink: MastermindAuditSink,
  receipt: InfrastructureRecoveryReceipt,
  context: MastermindRecoveryAuditContext,
): MastermindAuditEvent {
  const type: MastermindAuditEventType = receipt.status === 'DRIFT_DETECTED'
    ? 'DRIFT_DETECTED'
    : receipt.status === 'RECOVERED'
      ? 'RECOVERY_VERIFIED'
      : receipt.status === 'RECOVERY_FAILED'
        ? 'RECOVERY_FAILED'
        : 'INFRASTRUCTURE_RECOVERY';
  const event: MastermindAuditEvent = {
    id: `mastermind-recovery:${context.correlationId}:${receipt.observedAt}`,
    type,
    occurredAt: receipt.observedAt,
    actor: context.actor,
    authorizationId: receipt.authorizationId,
    correlationId: context.correlationId,
    resourceRevision: receipt.desiredRevision,
    status: receipt.verified ? 'RECORDED' : 'FAILED',
    evidence: {
      recoveryVersion: receipt.recoveryVersion,
      recoveryStatus: receipt.status,
      verified: receipt.verified,
      driftDetected: receipt.driftPlan.driftDetected,
      driftActions: receipt.driftPlan.actions,
      controllerReceipt: receipt.controllerReceipt,
      error: receipt.error,
    },
  };
  sink.append(event);
  return cloneEvent(event);
}

export function recordCapabilityHealthChecked(
  sink: MastermindAuditSink,
  result: CapabilityHealthResult,
  context: MastermindControlAuditContext,
): MastermindAuditEvent {
  const event: MastermindAuditEvent = {
    id: `mastermind-capability-health:${context.correlationId}:${result.capabilityId}:${result.checkedAt}`,
    type: 'CAPABILITY_HEALTH_CHECKED',
    occurredAt: result.checkedAt,
    actor: context.actor,
    authorizationId: context.authorizationId,
    correlationId: context.correlationId,
    status: result.status === 'HEALTHY' || result.status === 'NOT_ACTIVE' ? 'RECORDED' : 'FAILED',
    evidence: { capabilityId: result.capabilityId, healthStatus: result.status, reason: result.reason, proofId: result.proofId },
  };
  sink.append(event);
  return cloneEvent(event);
}

export function recordCapabilityRevoked(
  sink: MastermindAuditSink,
  result: CapabilityHealthResult,
  context: MastermindControlAuditContext,
): MastermindAuditEvent {
  const event: MastermindAuditEvent = {
    id: `mastermind-capability-revoked:${context.correlationId}:${result.capabilityId}:${result.checkedAt}`,
    type: 'CAPABILITY_REVOKED',
    occurredAt: result.checkedAt,
    actor: context.actor,
    authorizationId: context.authorizationId,
    correlationId: context.correlationId,
    status: 'RECORDED',
    evidence: { capabilityId: result.capabilityId, healthStatus: result.status, reason: result.reason, proofId: result.proofId, revocationAuthorizationId: result.authorizationId },
  };
  sink.append(event);
  return cloneEvent(event);
}

export function recordMissionStarted(
  sink: MastermindAuditSink,
  graph: MissionGraph,
  context: MastermindControlAuditContext,
  occurredAt = new Date().toISOString(),
): MastermindAuditEvent {
  const event: MastermindAuditEvent = {
    id: `mastermind-mission-started:${context.correlationId}:${graph.id}`,
    type: 'MISSION_STARTED',
    occurredAt,
    actor: context.actor,
    authorizationId: context.authorizationId,
    correlationId: context.correlationId,
    status: 'RECORDED',
    evidence: { missionId: graph.id, objective: graph.objective, nodeIds: graph.nodes.map((node) => node.id) },
  };
  sink.append(event);
  return cloneEvent(event);
}

function recordMissionNode(
  sink: MastermindAuditSink,
  type: 'MISSION_NODE_STARTED' | 'MISSION_NODE_SUCCEEDED' | 'MISSION_NODE_FAILED',
  node: MissionNode,
  context: MastermindControlAuditContext,
  occurredAt: string,
): MastermindAuditEvent {
  const event: MastermindAuditEvent = {
    id: `mastermind-mission-node:${context.correlationId}:${node.id}:${node.attempt}:${type}`,
    type,
    occurredAt,
    actor: context.actor,
    authorizationId: context.authorizationId,
    correlationId: context.correlationId,
    status: type === 'MISSION_NODE_FAILED' ? 'FAILED' : 'RECORDED',
    evidence: {
      missionNodeId: node.id,
      capability: node.capability,
      status: node.status,
      attempt: node.attempt,
      outputRef: node.outputRef,
      failureReason: node.failureReason,
      dependencies: [...node.dependsOn],
    },
  };
  sink.append(event);
  return cloneEvent(event);
}

export function recordMissionNodeStarted(sink: MastermindAuditSink, node: MissionNode, context: MastermindControlAuditContext, occurredAt = new Date().toISOString()): MastermindAuditEvent {
  return recordMissionNode(sink, 'MISSION_NODE_STARTED', node, context, occurredAt);
}

export function recordMissionNodeSucceeded(sink: MastermindAuditSink, node: MissionNode, context: MastermindControlAuditContext, occurredAt = new Date().toISOString()): MastermindAuditEvent {
  return recordMissionNode(sink, 'MISSION_NODE_SUCCEEDED', node, context, occurredAt);
}

export function recordMissionNodeFailed(sink: MastermindAuditSink, node: MissionNode, context: MastermindControlAuditContext, occurredAt = new Date().toISOString()): MastermindAuditEvent {
  return recordMissionNode(sink, 'MISSION_NODE_FAILED', node, context, occurredAt);
}

export function recordMissionCompleted(
  sink: MastermindAuditSink,
  graph: MissionGraph,
  status: 'SUCCEEDED' | 'FAILED',
  context: MastermindControlAuditContext,
  occurredAt = new Date().toISOString(),
): MastermindAuditEvent {
  const event: MastermindAuditEvent = {
    id: `mastermind-mission-completed:${context.correlationId}:${graph.id}:${status}`,
    type: 'MISSION_COMPLETED',
    occurredAt,
    actor: context.actor,
    authorizationId: context.authorizationId,
    correlationId: context.correlationId,
    status: status === 'SUCCEEDED' ? 'RECORDED' : 'FAILED',
    evidence: {
      missionId: graph.id,
      missionStatus: status,
      nodeStatuses: graph.nodes.map((node) => ({ id: node.id, status: node.status, attempt: node.attempt })),
    },
  };
  sink.append(event);
  return cloneEvent(event);
}
