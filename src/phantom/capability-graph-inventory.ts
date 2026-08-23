/**
 * Phantom Capability Graph -> Capability Compiler inventory adapter.
 *
 * Makes the Capability Graph the reusable-capability source of truth for
 * Mastermind's Capability Compiler. No external registry is required.
 */

import type { CapabilityDescriptor, CapabilityInventory } from './capability-compiler';
import type { CapabilityGraph } from './capability-graph';

export class CapabilityGraphInventory implements CapabilityInventory {
  public constructor(private readonly graph: CapabilityGraph) {}

  list(): CapabilityDescriptor[] {
    return this.graph.reusableCapabilities().map((node) => ({
      id: node.id,
      name: node.name,
      version: node.version,
      capabilities: [node.name, ...(node.metadata?.capabilities?.split(',').map((value) => value.trim()).filter(Boolean) ?? [])],
      dependencies: [],
      costClass: node.costClass,
      reliability: node.reliability,
      reproducible: node.reproducible,
    }));
  }
}
