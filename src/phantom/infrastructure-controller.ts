/**
 * Phantom Infrastructure Controller.
 *
 * Executes an already-authorized Mastermind reconciliation plan through a
 * Phantom-controlled adapter. Planning remains separate from mutation; the
 * controller refuses to apply plans without explicit authorization and records
 * the observed result so desired-vs-actual state can be evaluated again.
 */

import type {
  ActualState,
  CanonicalDesiredState,
  ReconciliationPlan,
  ReconciliationAction,
  ReconciliationStep,
} from './desired-state';
import {
  recordInfrastructureMutation,
  type MastermindAuditSink,
  type MastermindControlAuditContext,
} from './mastermind-audit';

export interface InfrastructureAuthorization {
  authorized: boolean;
  authorizationId: string;
  authorizedBy: string;
  reason: string;
}

export interface InfrastructureMutation {
  action: ReconciliationAction;
  resourceId: string;
  kind: string;
  version: string;
  configuration: Record<string, unknown>;
}

export interface InfrastructureMutationResult {
  resourceId: string;
  action: ReconciliationAction;
  status: 'APPLIED' | 'NOOP' | 'FAILED';
  error?: string;
}

export interface InfrastructureControllerAdapter {
  apply(mutation: InfrastructureMutation): InfrastructureMutationResult;
  observe(): ActualState;
}

export interface InfrastructureControllerReceipt {
  controllerVersion: '1';
  desiredRevision: string;
  authorizationId: string;
  appliedAt: string;
  results: InfrastructureMutationResult[];
  actualState: ActualState;
}

function assertAuthorization(auth: InfrastructureAuthorization): void {
  if (!auth.authorized) throw new Error('Infrastructure mutation is not authorized');
  if (!auth.authorizationId.trim()) throw new Error('Infrastructure authorization id is required');
  if (!auth.authorizedBy.trim()) throw new Error('Infrastructure authorization actor is required');
  if (!auth.reason.trim()) throw new Error('Infrastructure authorization reason is required');
}

function toMutation(
  desired: CanonicalDesiredState,
  step: ReconciliationStep,
): InfrastructureMutation {
  const resource = desired.resources.find((candidate) => candidate.id === step.resourceId) ?? step.actual;
  if (!resource) throw new Error(`Reconciliation resource not found: ${step.resourceId}`);
  return {
    action: step.action,
    resourceId: resource.id,
    kind: resource.kind,
    version: resource.version,
    configuration: { ...resource.configuration },
  };
}

/** Applies a previously planned reconciliation through the injected Phantom infrastructure adapter. */
export function applyInfrastructurePlan(
  desiredState: CanonicalDesiredState,
  plan: ReconciliationPlan,
  authorization: InfrastructureAuthorization,
  adapter: InfrastructureControllerAdapter,
): InfrastructureControllerReceipt {
  assertAuthorization(authorization);

  const results = plan.steps.map((step) => {
    if (step.action === 'NOOP') {
      return { resourceId: step.resourceId, action: step.action, status: 'NOOP' as const };
    }

    try {
      return adapter.apply(toMutation(desiredState, step));
    } catch (error) {
      return {
        resourceId: step.resourceId,
        action: step.action,
        status: 'FAILED' as const,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return {
    controllerVersion: '1',
    desiredRevision: desiredState.revision,
    authorizationId: authorization.authorizationId,
    appliedAt: new Date().toISOString(),
    results,
    actualState: adapter.observe(),
  };
}

/** Audited controller boundary: mutation remains authorization-gated and provider-neutral. */
export function applyInfrastructurePlanAudited(
  desiredState: CanonicalDesiredState,
  plan: ReconciliationPlan,
  authorization: InfrastructureAuthorization,
  adapter: InfrastructureControllerAdapter,
  audit: MastermindAuditSink,
  auditContext: MastermindControlAuditContext,
): InfrastructureControllerReceipt {
  const receipt = applyInfrastructurePlan(desiredState, plan, authorization, adapter);
  recordInfrastructureMutation(audit, receipt, {
    ...auditContext,
    authorizationId: authorization.authorizationId,
  });
  return receipt;
}

export function infrastructurePlanSucceeded(receipt: InfrastructureControllerReceipt): boolean {
  return receipt.results.every((result) => result.status !== 'FAILED');
}
