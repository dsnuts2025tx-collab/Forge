/**
 * Phantom Mastermind control-plane integration.
 *
 * Bridges the Capability Compiler, Capability Graph, and Canonical Desired State
 * into one provider-neutral planning boundary. It does not mutate production by
 * itself; infrastructure mutation remains an injected, authorization-gated
 * boundary.
 */

import {
  ActiveCapabilityRegistry,
} from './active-capability-registry';
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
import {
  recordCapabilityPlanned,
  recordDesiredStatePersisted,
  type MastermindAuditSink,
  type MastermindControlAuditContext,
} from './mastermind-audit';

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

function descriptorForNode(node: CapabilityGraphNode, graph: CapabilityGraph) {
  return {
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
  };
}

function graphInventory(
  graph: CapabilityGraph,
  activeRegistry?: ActiveCapabilityRegistry,
): CapabilityInventory {
  const all = () => graph.reusableCapabilities().map((node) => descriptorForNode(node, graph));
  if (!activeRegistry) return { list: all };

  return {
    list: all,
    listActive: () => all().filter((descriptor) => activeRegistry.isActive(descriptor.id)),
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
 * reproducible. When an active registry is supplied, only proof-gated active
 * capabilities are eligible for REUSE. Existing desired state is not silently
 * overwritten by this planning function; callers must explicitly persist the
 * returned state.
 */
export function planMastermindCapability(
  request: MastermindCapabilityRequest,
  graph: CapabilityGraph,
  actual: ActualState,
  revision: string,
  activeRegistry?: ActiveCapabilityRegistry,
): MastermindControlPlan {
  const manifest = compileCapability(
    request.intent,
    request.requirements,
    graphInventory(graph, activeRegistry),
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

/** Audited planning variant: emits the canonical capability-planning receipt. */
export function planMastermindCapabilityAudited(
  request: MastermindCapabilityRequest,
  graph: CapabilityGraph,
  actual: ActualState,
  revision: string,
  audit: MastermindAuditSink,
  auditContext: MastermindControlAuditContext,
  activeRegistry?: ActiveCapabilityRegistry,
): MastermindControlPlan {
  const plan = planMastermindCapability(request, graph, actual, revision, activeRegistry);
  recordCapabilityPlanned(audit, plan, auditContext);
  return plan;
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

/** Audited persistence variant: records the canonical desired-state receipt. */
export function persistMastermindDesiredStateAudited(
  plan: MastermindControlPlan,
  store: MastermindDesiredStateStore,
  audit: MastermindAuditSink,
  auditContext: MastermindControlAuditContext,
): void {
  store.save(plan.desiredState);
  recordDesiredStatePersisted(audit, plan.desiredState, auditContext);
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
