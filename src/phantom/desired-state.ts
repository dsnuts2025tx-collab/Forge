/**
 * Phantom Canonical Desired State control kernel.
 *
 * Defines the authorized state Phantom intends to operate, compares it with
 * observed actual state, and produces a deterministic reconciliation plan.
 * Mutation is deliberately injected so infrastructure providers remain
 * replaceable boundaries and production changes can remain authorization-gated.
 */

export type DesiredStateResourceKind =
  | 'capability'
  | 'worker'
  | 'infrastructure'
  | 'service'
  | 'api'
  | 'workflow'
  | 'data'
  | 'policy';

export interface DesiredStateResource {
  id: string;
  kind: DesiredStateResourceKind;
  version: string;
  configuration: Record<string, string>;
  authorizationRequired?: boolean;
}

export interface CanonicalDesiredState {
  version: 1;
  revision: string;
  resources: DesiredStateResource[];
}

export interface ActualState {
  resources: DesiredStateResource[];
}

export type ReconciliationAction = 'CREATE' | 'UPDATE' | 'REMOVE' | 'NOOP';

export interface ReconciliationStep {
  resourceId: string;
  action: ReconciliationAction;
  desired?: DesiredStateResource;
  actual?: DesiredStateResource;
  reason: string;
}

export interface ReconciliationPlan {
  desiredRevision: string;
  steps: ReconciliationStep[];
  driftDetected: boolean;
}

export interface DesiredStateObserver {
  observe(): ActualState;
}

export interface DesiredStateApplier {
  apply(step: ReconciliationStep): void;
}

function cloneResource(resource: DesiredStateResource): DesiredStateResource {
  return {
    ...resource,
    configuration: { ...resource.configuration },
  };
}

function normalizeState(resources: DesiredStateResource[]): DesiredStateResource[] {
  return resources.map(cloneResource).sort((a, b) => a.id.localeCompare(b.id));
}

function sameResource(a: DesiredStateResource, b: DesiredStateResource): boolean {
  if (a.kind !== b.kind || a.version !== b.version || a.authorizationRequired !== b.authorizationRequired) return false;
  const aKeys = Object.keys(a.configuration).sort();
  const bKeys = Object.keys(b.configuration).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key, index) => key === bKeys[index] && a.configuration[key] === b.configuration[key]);
}

function validateResources(resources: DesiredStateResource[]): void {
  const ids = new Set<string>();
  for (const resource of resources) {
    if (!resource.id.trim()) throw new Error('Desired-state resource id is required');
    if (ids.has(resource.id)) throw new Error(`Duplicate desired-state resource id: ${resource.id}`);
    if (!resource.version.trim()) throw new Error(`Desired-state resource version is required: ${resource.id}`);
    ids.add(resource.id);
  }
}

export function createCanonicalDesiredState(
  revision: string,
  resources: DesiredStateResource[],
): CanonicalDesiredState {
  if (!revision.trim()) throw new Error('Canonical desired-state revision is required');
  validateResources(resources);
  return { version: 1, revision: revision.trim(), resources: normalizeState(resources) };
}

/** Compare canonical desired state with an observed actual state. */
export function planReconciliation(
  desired: CanonicalDesiredState,
  actual: ActualState,
): ReconciliationPlan {
  if (desired.version !== 1) throw new Error(`Unsupported desired-state version: ${desired.version}`);
  validateResources(desired.resources);
  validateResources(actual.resources);

  const desiredById = new Map(desired.resources.map((resource) => [resource.id, resource]));
  const actualById = new Map(actual.resources.map((resource) => [resource.id, resource]));
  const steps: ReconciliationStep[] = [];

  for (const resource of normalizeState(desired.resources)) {
    const observed = actualById.get(resource.id);
    if (!observed) {
      steps.push({ resourceId: resource.id, action: 'CREATE', desired: cloneResource(resource), reason: 'Desired resource is absent from actual state' });
    } else if (!sameResource(resource, observed)) {
      steps.push({ resourceId: resource.id, action: 'UPDATE', desired: cloneResource(resource), actual: cloneResource(observed), reason: 'Actual resource differs from canonical desired state' });
    } else {
      steps.push({ resourceId: resource.id, action: 'NOOP', desired: cloneResource(resource), actual: cloneResource(observed), reason: 'Actual state matches canonical desired state' });
    }
  }

  for (const resource of normalizeState(actual.resources)) {
    if (!desiredById.has(resource.id)) {
      steps.push({ resourceId: resource.id, action: 'REMOVE', actual: cloneResource(resource), reason: 'Actual resource is not authorized by canonical desired state' });
    }
  }

  return {
    desiredRevision: desired.revision,
    steps: steps.sort((a, b) => a.resourceId.localeCompare(b.resourceId) || a.action.localeCompare(b.action)),
    driftDetected: steps.some((step) => step.action !== 'NOOP'),
  };
}

export function reconcileDesiredState(
  desired: CanonicalDesiredState,
  observer: DesiredStateObserver,
  applier: DesiredStateApplier,
): ReconciliationPlan {
  const plan = planReconciliation(desired, observer.observe());
  for (const step of plan.steps) {
    if (step.action === 'NOOP') continue;
    applier.apply(step);
  }
  return plan;
}

export function desiredStateMatchesActual(
  desired: CanonicalDesiredState,
  actual: ActualState,
): boolean {
  return !planReconciliation(desired, actual).driftDetected;
}
