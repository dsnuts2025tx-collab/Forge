/**
 * Phantom Mastermind control-plane integration.
 *
 * Bridges the Capability Compiler, Capability Graph, and Canonical Desired State
 * into one provider-neutral planning boundary. It does not mutate production by
 * itself; infrastructure mutation remains an injected, authorization-gated
 * boundary.
 */

import {
  CapabilityGraph,
  type CapabilityGraphNode,
} from './capability-graph';
import {
  compileCapability,
  type CapabilityInventory,
  type CapabilityManifest,
  type CapabilityRequirement,
} from './capability-compiler';
import {
  createCanonicalDesiredState,
  planReconciliation,
  type ActualState,
  type CanonicalDesiredState,
  type DesiredStateResource,
  type ReconciliationPlan,
} from './desired-state';

export interface MastermindCapabilityRequest {
  intent: string;
  requirements: CapabilityRequirement[];
  proofCriteria: string[];
  authorizationRequired?: boolean;
  manifestId?: string;
}

export interface MastermindControlPlan {
  manifest: CapabilityManifest;
  desiredState: CanonicalDesiredState;
  reconciliation: ReconciliationPlan;
}

export interface MastermindDesiredStateStore {
  load(): CanonicalDesiredState | undefined;
  save(state: CanonicalDesiredState): void;
}

function graphInventory(graph: CapabilityGraph): CapabilityInventory {
  return {
    list: () => graph.reusableCapabilities().map((node: CapabilityGraphNode) => ({
      id: node.id,
      name: node.name,
      version: node.version,
      capabilities: [node.name],
      dependencies: graph
        .related(node.id)
        .filter((edge) => edge.from === node.id && edge.relationship === 'DEPENDS_ON')
        .map((edge) => edge.to),
      costClass: node.costClass,
      reliability: node.reliability,
      reproducible: node.reproducible,
    })),
  };
}

function manifestToDesiredResources(manifest: CapabilityManifest): DesiredStateResource[] {
  return manifest.plan.map((step) => ({
    id: `capability:${step.requirementId}`,
    kind: 'capability',
    version: '1',
    configuration: {
      action: step.action,
      selectedCapabilityIds: step.selectedCapabilityIds.join(','),
      missingCapabilities: step.missingCapabilities.join(','),
      rationale: step.rationale,
    },
    authorizationRequired: manifest.authorizationRequired,
  }));
}

/**
 * Compiles an authorized intent against the canonical capability graph and
 * produces the desired-state reconciliation plan needed to make the capability
 * reproducible. Existing desired state is not silently overwritten by this
 * planning function; callers must explicitly persist the returned state.
 */
export function planMastermindCapability(
  request: MastermindCapabilityRequest,
  graph: CapabilityGraph,
  actual: ActualState,
  revision: string,
): MastermindControlPlan {
  const manifest = compileCapability(
    request.intent,
    request.requirements,
    graphInventory(graph),
    request.proofCriteria,
    request.authorizationRequired ?? true,
    request.manifestId,
  );

  const desiredState = createCanonicalDesiredState(
    revision,
    manifestToDesiredResources(manifest),
  );

  return {
    manifest,
    desiredState,
    reconciliation: planReconciliation(desiredState, actual),
  };
}

/**
 * Applies a newly compiled desired state to the Phantom-owned configuration
 * store. This is intentionally separate from infrastructure reconciliation.
 */
export function persistMastermindDesiredState(
  plan: MastermindControlPlan,
  store: MastermindDesiredStateStore,
): void {
  store.save(plan.desiredState);
}

/** Verify that a stored desired state is the exact state represented by a plan. */
export function mastermindPlanMatchesStoredState(
  plan: MastermindControlPlan,
  store: MastermindDesiredStateStore,
): boolean {
  const stored = store.load();
  if (!stored || stored.version !== plan.desiredState.version) return false;
  if (stored.revision !== plan.desiredState.revision) return false;
  if (stored.resources.length !== plan.desiredState.resources.length) return false;
  return stored.resources.every((resource, index) => {
    const expected = plan.desiredState.resources[index];
    return resource.id === expected.id
      && resource.kind === expected.kind
      && resource.version === expected.version
      && resource.authorizationRequired === expected.authorizationRequired
      && JSON.stringify(resource.configuration) === JSON.stringify(expected.configuration);
  });
}
