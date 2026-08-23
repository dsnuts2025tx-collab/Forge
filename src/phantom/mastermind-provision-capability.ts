/**
 * Phantom Mastermind canonical capability provisioning command.
 *
 * This is the reusable end-to-end control boundary behind:
 * MASTER MIND — PROVISION CAPABILITY.
 *
 * It composes existing primitives rather than introducing another state model:
 * Capability Compiler -> Desired State -> authorized Infrastructure Controller
 * -> observed verification -> proof-gated Activation -> Active Registry.
 * Missing capability work remains an injected Phantom-controlled provisioning
 * boundary. No external provider is required by this control kernel.
 */

import {
  planMastermindCapability,
  type MastermindCapabilityRequest,
  type MastermindControlPlan,
  type MastermindDesiredStateStore,
} from './mastermind-control-plane';
import {
  applyInfrastructurePlan,
  infrastructurePlanSucceeded,
  type InfrastructureAuthorization,
  type InfrastructureControllerAdapter,
} from './infrastructure-controller';
import {
  desiredStateMatchesActual,
  type ActualState,
} from './desired-state';
import {
  activateAndRegisterCapability,
  type CapabilityLifecycleResult,
} from './capability-lifecycle';
import {
  ActiveCapabilityRegistry,
  type ActiveCapabilityPersistence,
} from './active-capability-registry';
import type {
  CapabilityActivationAuthorization,
  CapabilityActivationProof,
  CapabilityActivationSink,
} from './capability-activation';
import type { CapabilityGraph } from './capability-graph';
import {
  recordCapabilityProvisioned,
  type MastermindAuditSink,
  type MastermindControlAuditContext,
} from './mastermind-audit';

export interface CapabilityProvisionAuthorization extends InfrastructureAuthorization {
  activationAuthorization: CapabilityActivationAuthorization;
}

/**
 * The only boundary that may create the genuinely missing capability work.
 * Implementations remain Phantom-controlled and may target compute, workers,
 * services, APIs, data, or other internal capability builders.
 */
export interface CapabilityProvisioner {
  provision(
    plan: MastermindControlPlan,
    authorization: CapabilityProvisionAuthorization,
  ): void;
}

export interface MastermindProvisionCapabilityResult {
  plan: MastermindControlPlan;
  provisionedMissingCapabilityWork: boolean;
  infrastructureApplied: boolean;
  infrastructureVerified: boolean;
  lifecycle: CapabilityLifecycleResult;
}

/**
 * Executes the canonical provision-capability lifecycle. Planning remains
 * deterministic; mutation is authorization-gated; activation remains proof-
 * gated; and the active registry is updated only after all gates succeed.
 */
export function provisionCapability(
  request: MastermindCapabilityRequest,
  graph: CapabilityGraph,
  actual: ActualState,
  revision: string,
  authorization: CapabilityProvisionAuthorization,
  infrastructure: InfrastructureControllerAdapter,
  desiredStateStore: MastermindDesiredStateStore,
  registry: ActiveCapabilityRegistry,
  proof: CapabilityActivationProof | undefined,
  activePersistence?: ActiveCapabilityPersistence,
  activationSink?: CapabilityActivationSink,
  provisioner?: CapabilityProvisioner,
  audit?: MastermindAuditSink,
  auditContext?: MastermindControlAuditContext,
  now: string = new Date().toISOString(),
): MastermindProvisionCapabilityResult {
  const plan = planMastermindCapability(request, graph, actual, revision, registry);

  desiredStateStore.save(plan.desiredState);

  const hasMissingWork = plan.manifest.missingCapabilities.length > 0;
  if (hasMissingWork) {
    if (!provisioner) {
      throw new Error('Missing capability work requires a Phantom-controlled provisioner');
    }
    if (!authorization.authorized || !authorization.authorizationId || !authorization.authorizedBy || !authorization.reason) {
      throw new Error('Capability provisioning requires explicit infrastructure authorization');
    }
    provisioner.provision(plan, authorization);
  }

  const receipt = applyInfrastructurePlan(
    plan.desiredState,
    plan.reconciliation,
    authorization,
    infrastructure,
  );

  const infrastructureApplied = receipt.results.some((result) => result.status === 'APPLIED');
  const infrastructureVerified = infrastructurePlanSucceeded(receipt)
    && desiredStateMatchesActual(plan.desiredState, receipt.actualState);

  if (!infrastructureVerified) {
    throw new Error('Capability provisioning stopped: canonical desired state was not verified after infrastructure reconciliation');
  }

  const capabilityId = plan.manifest.reusableCapabilityIds[0]
    ?? plan.manifest.composedCapabilityIds[0];
  if (!capabilityId) {
    throw new Error('Capability activation requires a resolved capability id; missing capability provisioning must update the canonical graph before activation');
  }

  const lifecycle = activateAndRegisterCapability(
    {
      capabilityId,
      manifestId: plan.manifest.id,
      proofRequired: plan.manifest.proofCriteria.length > 0,
      reconciliationRequired: true,
      proofCriteria: plan.manifest.proofCriteria,
    },
    proof,
    authorization.activationAuthorization,
    infrastructureVerified,
    registry,
    activePersistence,
    activationSink,
    now,
  );

  if (audit && auditContext) {
    recordCapabilityProvisioned(
      audit,
      {
        manifestId: plan.manifest.id,
        missingCapabilityWork: hasMissingWork,
        infrastructureApplied,
        infrastructureVerified,
        activationStatus: lifecycle.activation.status,
        registered: lifecycle.registered,
      },
      auditContext,
      plan.desiredState.revision,
      now,
    );
  }

  return {
    plan,
    provisionedMissingCapabilityWork: hasMissingWork,
    infrastructureApplied,
    infrastructureVerified,
    lifecycle,
  };
}
