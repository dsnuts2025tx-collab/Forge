/**
 * Phantom Infrastructure Drift + Recovery orchestration.
 *
 * Closes the desired -> actual -> drift -> reconcile -> verify loop around the
 * Infrastructure Controller. Recovery is explicit, authorization-gated, and
 * fail-closed: Phantom will not report recovery as successful unless the
 * post-reconciliation observed state exactly matches canonical desired state.
 */

import {
  desiredStateMatchesActual,
  planReconciliation,
  type ActualState,
  type CanonicalDesiredState,
  type ReconciliationPlan,
} from './desired-state';
import {
  applyInfrastructurePlan,
  infrastructurePlanSucceeded,
  type InfrastructureAuthorization,
  type InfrastructureControllerAdapter,
  type InfrastructureControllerReceipt,
} from './infrastructure-controller';

export type InfrastructureRecoveryStatus =
  | 'IN_SYNC'
  | 'DRIFT_DETECTED'
  | 'RECOVERED'
  | 'RECOVERY_FAILED';

export interface InfrastructureRecoveryReceipt {
  recoveryVersion: '1';
  status: InfrastructureRecoveryStatus;
  desiredRevision: string;
  observedAt: string;
  authorizationId?: string;
  driftPlan: ReconciliationPlan;
  controllerReceipt?: InfrastructureControllerReceipt;
  verified: boolean;
  error?: string;
}

/**
 * Observe the current environment without mutating it.
 * This is the safe entry point for continuous drift detection.
 */
export function inspectInfrastructureDrift(
  desired: CanonicalDesiredState,
  adapter: InfrastructureControllerAdapter,
): InfrastructureRecoveryReceipt {
  const observed = adapter.observe();
  const driftPlan = planReconciliation(desired, observed);

  if (!driftPlan.driftDetected) {
    return {
      recoveryVersion: '1',
      status: 'IN_SYNC',
      desiredRevision: desired.revision,
      observedAt: new Date().toISOString(),
      driftPlan,
      verified: true,
    };
  }

  return {
    recoveryVersion: '1',
    status: 'DRIFT_DETECTED',
    desiredRevision: desired.revision,
    observedAt: new Date().toISOString(),
    driftPlan,
    verified: false,
  };
}

/**
 * Reconstruct the authorized desired state after drift is detected.
 * Mutation remains delegated to the existing Infrastructure Controller.
 */
export function recoverInfrastructure(
  desired: CanonicalDesiredState,
  authorization: InfrastructureAuthorization,
  adapter: InfrastructureControllerAdapter,
): InfrastructureRecoveryReceipt {
  const before = adapter.observe();
  const driftPlan = planReconciliation(desired, before);

  if (!driftPlan.driftDetected) {
    return {
      recoveryVersion: '1',
      status: 'IN_SYNC',
      desiredRevision: desired.revision,
      observedAt: new Date().toISOString(),
      driftPlan,
      verified: true,
      authorizationId: authorization.authorizationId,
    };
  }

  try {
    const controllerReceipt = applyInfrastructurePlan(
      desired,
      driftPlan,
      authorization,
      adapter,
    );

    const after: ActualState = controllerReceipt.actualState;
    const verified = infrastructurePlanSucceeded(controllerReceipt)
      && desiredStateMatchesActual(desired, after);

    return {
      recoveryVersion: '1',
      status: verified ? 'RECOVERED' : 'RECOVERY_FAILED',
      desiredRevision: desired.revision,
      observedAt: new Date().toISOString(),
      authorizationId: authorization.authorizationId,
      driftPlan,
      controllerReceipt,
      verified,
      error: verified ? undefined : 'Post-recovery state does not match canonical desired state',
    };
  } catch (error) {
    return {
      recoveryVersion: '1',
      status: 'RECOVERY_FAILED',
      desiredRevision: desired.revision,
      observedAt: new Date().toISOString(),
      authorizationId: authorization.authorizationId,
      driftPlan,
      verified: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
