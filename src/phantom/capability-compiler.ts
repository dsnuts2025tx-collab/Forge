/**
 * Phantom Capability Compiler control kernel.
 *
 * Converts authorized intent into a reproducible capability manifest by
 * inventorying existing capabilities first, then selecting reuse/composition,
 * and finally declaring only the genuinely missing capability work.
 *
 * This module owns planning semantics only. Provisioning, infrastructure,
 * workers, storage, and external services remain injected boundaries.
 */

export type CapabilityPlanAction = 'REUSE' | 'COMPOSE' | 'PROVISION';

export interface CapabilityDescriptor {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  dependencies: string[];
  costClass?: string;
  reliability?: number;
  reproducible?: boolean;
}

export interface CapabilityRequirement {
  id: string;
  capability: string;
  requiredVersion?: string;
  dependsOn?: string[];
  required?: boolean;
}

export interface CapabilityPlanStep {
  requirementId: string;
  action: CapabilityPlanAction;
  selectedCapabilityIds: string[];
  missingCapabilities: string[];
  rationale: string;
}

export interface CapabilityManifest {
  id: string;
  intent: string;
  requirements: CapabilityRequirement[];
  plan: CapabilityPlanStep[];
  reusableCapabilityIds: string[];
  composedCapabilityIds: string[];
  missingCapabilities: string[];
  proofCriteria: string[];
  authorizationRequired: boolean;
}

export interface CapabilityInventory {
  list(): CapabilityDescriptor[];
  /** When present, only verified-active capabilities are eligible for REUSE. */
  listActive?(): CapabilityDescriptor[];
}

function cloneDescriptor(descriptor: CapabilityDescriptor): CapabilityDescriptor {
  return {
    ...descriptor,
    capabilities: [...descriptor.capabilities],
    dependencies: [...descriptor.dependencies],
  };
}

function cloneRequirement(requirement: CapabilityRequirement): CapabilityRequirement {
  return { ...requirement, ...(requirement.dependsOn ? { dependsOn: [...requirement.dependsOn] } : {}) };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function assertRequirements(requirements: CapabilityRequirement[]): void {
  const ids = new Set<string>();
  for (const requirement of requirements) {
    if (!requirement.id || ids.has(requirement.id)) {
      throw new Error(`Duplicate or empty capability requirement id: ${requirement.id}`);
    }
    if (!requirement.capability.trim()) {
      throw new Error(`Capability requirement must name a capability: ${requirement.id}`);
    }
    if (requirement.requiredVersion !== undefined && !requirement.requiredVersion.trim()) {
      throw new Error(`Required capability version cannot be empty: ${requirement.id}`);
    }
    ids.add(requirement.id);
  }
  for (const requirement of requirements) {
    for (const dependency of requirement.dependsOn ?? []) {
      if (!ids.has(dependency)) {
        throw new Error(`Unknown capability requirement dependency: ${dependency}`);
      }
    }
  }
}

function dependencyFirstRequirements(
  requirements: CapabilityRequirement[],
): CapabilityRequirement[] {
  const byId = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const ordered: CapabilityRequirement[] = [];

  function visit(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new Error(`Capability requirement dependency cycle detected at: ${id}`);
    }
    const requirement = byId.get(id);
    if (!requirement) throw new Error(`Unknown capability requirement dependency: ${id}`);

    visiting.add(id);
    for (const dependency of requirement.dependsOn ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
    ordered.push(requirement);
  }

  for (const requirement of requirements) visit(requirement.id);
  return ordered;
}

function versionMatches(requirement: CapabilityRequirement, candidate: CapabilityDescriptor): boolean {
  if (requirement.requiredVersion === undefined) return true;
  return normalize(candidate.version) === normalize(requirement.requiredVersion);
}

function matchingCapabilities(
  requirement: CapabilityRequirement,
  inventory: CapabilityDescriptor[],
): CapabilityDescriptor[] {
  const wanted = normalize(requirement.capability);
  return inventory.filter((candidate) =>
    candidate.capabilities.some((capability) => normalize(capability) === wanted)
      && versionMatches(requirement, candidate),
  );
}

function chooseBest(candidates: CapabilityDescriptor[]): CapabilityDescriptor | undefined {
  return [...candidates]
    .sort((a, b) => {
      const reproducibility = Number(Boolean(b.reproducible)) - Number(Boolean(a.reproducible));
      if (reproducibility !== 0) return reproducibility;
      const reliability = (b.reliability ?? 0) - (a.reliability ?? 0);
      if (reliability !== 0) return reliability;
      return a.id.localeCompare(b.id);
    })[0];
}

/**
 * Compiles intent into a manifest. The compiler always inventories before it
 * proposes provisioning, and it never silently treats a missing capability as
 * available. If an active inventory is supplied, only verified-active entries
 * may satisfy a REUSE decision; merely existing graph entries remain available
 * to the surrounding planning layer but cannot be claimed as active.
 *
 * Requirement dependencies are evaluated dependency-first so composition can
 * only consume capabilities that have already been resolved in this plan.
 */
export function compileCapability(
  intent: string,
  requirements: CapabilityRequirement[],
  inventory: CapabilityInventory,
  proofCriteria: string[],
  authorizationRequired = true,
  manifestId = `capability:${Date.now().toString(36)}`,
): CapabilityManifest {
  if (!intent.trim()) throw new Error('Capability intent is required');
  if (proofCriteria.length === 0) throw new Error('Capability proof criteria are required');
  assertRequirements(requirements);

  const available = (inventory.listActive ? inventory.listActive() : inventory.list()).map(cloneDescriptor);
  const plan: CapabilityPlanStep[] = [];
  const reusableCapabilityIds: string[] = [];
  const composedCapabilityIds: string[] = [];
  const missingCapabilities: string[] = [];

  for (const requirement of dependencyFirstRequirements(requirements).map(cloneRequirement)) {
    const matches = matchingCapabilities(requirement, available);
    const selected = chooseBest(matches);

    if (selected) {
      reusableCapabilityIds.push(selected.id);
      plan.push({
        requirementId: requirement.id,
        action: 'REUSE',
        selectedCapabilityIds: [selected.id],
        missingCapabilities: [],
        rationale: `Verified-active capability ${selected.id} satisfies ${requirement.capability}${requirement.requiredVersion ? ` at version ${requirement.requiredVersion}` : ''}`,
      });
      continue;
    }

    const dependencyCapabilities = (requirement.dependsOn ?? [])
      .flatMap((dependencyId) => plan.find((step) => step.requirementId === dependencyId)?.selectedCapabilityIds ?? []);

    if (dependencyCapabilities.length > 0) {
      composedCapabilityIds.push(requirement.id);
      plan.push({
        requirementId: requirement.id,
        action: 'COMPOSE',
        selectedCapabilityIds: dependencyCapabilities,
        missingCapabilities: [requirement.capability],
        rationale: `Compose from verified dependency capabilities before provisioning the remaining gap`,
      });
      missingCapabilities.push(requirement.capability);
      continue;
    }

    missingCapabilities.push(requirement.capability);
    plan.push({
      requirementId: requirement.id,
      action: 'PROVISION',
      selectedCapabilityIds: [],
      missingCapabilities: [requirement.capability],
      rationale: `No verified-active capability satisfies ${requirement.capability}${requirement.requiredVersion ? ` at version ${requirement.requiredVersion}` : ''}; provision only this missing capability`,
    });
  }

  return {
    id: manifestId,
    intent: intent.trim(),
    requirements: requirements.map(cloneRequirement),
    plan,
    reusableCapabilityIds: [...new Set(reusableCapabilityIds)],
    composedCapabilityIds: [...new Set(composedCapabilityIds)],
    missingCapabilities: [...new Set(missingCapabilities)],
    proofCriteria: [...proofCriteria],
    authorizationRequired,
  };
}

export function capabilityManifestIsProvisioningMinimal(manifest: CapabilityManifest): boolean {
  return manifest.plan.every((step) => step.action !== 'PROVISION' || step.missingCapabilities.length > 0);
}
