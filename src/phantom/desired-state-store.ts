/**
 * Phantom-controlled desired-state integrity boundary.
 *
 * Wraps any injected desired-state persistence with validation and defensive
 * cloning so Mastermind never trusts persisted configuration merely because it
 * can be parsed. The underlying persistence mechanism remains replaceable and
 * is not a foundational dependency.
 */

import type { CanonicalDesiredState, DesiredStateResource } from './desired-state';

export interface DesiredStatePersistence {
  load(): CanonicalDesiredState | undefined;
  save(state: CanonicalDesiredState): void;
}

function cloneResource(resource: DesiredStateResource): DesiredStateResource {
  return { ...resource, configuration: { ...resource.configuration } };
}

function cloneState(state: CanonicalDesiredState): CanonicalDesiredState {
  return {
    version: state.version,
    revision: state.revision,
    resources: state.resources.map(cloneResource),
  };
}

export function validateCanonicalDesiredState(state: CanonicalDesiredState): void {
  if (state.version !== 1) {
    throw new Error(`Unsupported canonical desired-state version: ${state.version}`);
  }
  if (!state.revision.trim()) {
    throw new Error('Canonical desired-state revision is required');
  }

  const ids = new Set<string>();
  for (const resource of state.resources) {
    if (!resource.id.trim()) throw new Error('Canonical desired-state resource id is required');
    if (ids.has(resource.id)) throw new Error(`Duplicate canonical desired-state resource: ${resource.id}`);
    if (!resource.version.trim()) throw new Error(`Canonical desired-state resource version is required: ${resource.id}`);
    if (!resource.kind) throw new Error(`Canonical desired-state resource kind is required: ${resource.id}`);
    if (!resource.configuration || typeof resource.configuration !== 'object') {
      throw new Error(`Canonical desired-state resource configuration is invalid: ${resource.id}`);
    }
    ids.add(resource.id);
  }
}

export class VerifiedDesiredStateStore implements DesiredStatePersistence {
  constructor(private readonly persistence: DesiredStatePersistence) {}

  load(): CanonicalDesiredState | undefined {
    const state = this.persistence.load();
    if (!state) return undefined;
    validateCanonicalDesiredState(state);
    return cloneState(state);
  }

  save(state: CanonicalDesiredState): void {
    validateCanonicalDesiredState(state);
    this.persistence.save(cloneState(state));
  }

  verify(): void {
    const state = this.load();
    if (state) validateCanonicalDesiredState(state);
  }
}

/** Reference Phantom-controlled persistence adapter for local/test operation. */
export class InMemoryDesiredStatePersistence implements DesiredStatePersistence {
  private state: CanonicalDesiredState | undefined;

  load(): CanonicalDesiredState | undefined {
    return this.state ? cloneState(this.state) : undefined;
  }

  save(state: CanonicalDesiredState): void {
    validateCanonicalDesiredState(state);
    this.state = cloneState(state);
  }
}
