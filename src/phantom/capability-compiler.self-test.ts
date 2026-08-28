import { mkdirSync, writeFileSync } from 'node:fs';
import {
  capabilityManifestIsProvisioningMinimal,
  compileCapability,
  type CapabilityDescriptor,
  type CapabilityInventory,
} from './capability-compiler.js';
import { activateCapability, capabilityActivationSucceeded } from './capability-activation.js';
import { CapabilityGraph } from './capability-graph.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectThrows(action: () => unknown, message: string): void {
  try {
    action();
  } catch {
    return;
  }
  throw new Error(message);
}

const reproducible: CapabilityDescriptor = {
  id: 'cap.compiler.test.v2',
  name: 'Compiler Test Capability',
  version: '2.0.0',
  capabilities: ['verification'],
  dependencies: [],
  reliability: 0.99,
  reproducible: true,
};

const lessReliable: CapabilityDescriptor = {
  ...reproducible,
  id: 'cap.compiler.test.v1',
  reliability: 0.50,
  reproducible: false,
};

const inventory: CapabilityInventory = {
  list: () => [lessReliable, reproducible],
  listActive: () => [reproducible],
};

const manifest = compileCapability(
  'verify the capability compiler',
  [{ id: 'verify', capability: 'verification', requiredVersion: '2.0.0' }],
  inventory,
  ['typecheck', 'unit-test', 'integration-test'],
  true,
  'capability:test:compiler',
);

assert(manifest.plan.length === 1, 'compiler must emit one plan step');
assert(manifest.plan[0].action === 'REUSE', 'verified-active capability must be reused');
assert(manifest.plan[0].selectedCapabilityIds[0] === reproducible.id, 'compiler selected the wrong capability');
assert(manifest.missingCapabilities.length === 0, 'fully reusable manifest must have no missing capabilities');
assert(capabilityManifestIsProvisioningMinimal(manifest), 'reuse-only manifest must be provisioning-minimal');

const inactiveInventory: CapabilityInventory = {
  list: () => [reproducible],
  listActive: () => [],
};
const inactiveManifest = compileCapability(
  'reject inactive reuse',
  [{ id: 'verify', capability: 'verification', requiredVersion: '2.0.0' }],
  inactiveInventory,
  ['proof'],
);
assert(inactiveManifest.plan[0].action === 'PROVISION', 'inactive capability must not be reused');
assert(inactiveManifest.missingCapabilities[0] === 'verification', 'inactive capability must remain missing');

const composedManifest = compileCapability(
  'compose dependent capability',
  [
    { id: 'base', capability: 'base-capability' },
    { id: 'composed', capability: 'composed-capability', dependsOn: ['base'] },
  ],
  { list: () => [], listActive: () => [] },
  ['composition-proof'],
);
assert(composedManifest.plan[0].requirementId === 'base', 'dependencies must be resolved first');
assert(composedManifest.plan[1].action === 'COMPOSE', 'dependent requirement must compose from resolved dependency');
assert(composedManifest.plan[1].selectedCapabilityIds.length === 0, 'composition must not invent an unresolved capability');

expectThrows(
  () => compileCapability('duplicate ids', [
    { id: 'same', capability: 'one' },
    { id: 'same', capability: 'two' },
  ], inventory, ['proof']),
  'duplicate requirement ids must fail',
);

expectThrows(
  () => compileCapability('dependency cycle', [
    { id: 'a', capability: 'a', dependsOn: ['b'] },
    { id: 'b', capability: 'b', dependsOn: ['a'] },
  ], inventory, ['proof']),
  'dependency cycles must fail',
);

const graph = new CapabilityGraph();
graph.upsertNode({
  id: reproducible.id,
  kind: 'capability',
  name: reproducible.name,
  version: reproducible.version,
  reliability: reproducible.reliability,
  reproducible: true,
  proofCriteria: ['typecheck', 'unit-test', 'integration-test'],
});
const graphInventory: CapabilityInventory = {
  list: () => graph.reusableCapabilities().map((node) => ({
    id: node.id,
    name: node.name,
    version: node.version,
    capabilities: ['verification'],
    dependencies: [],
    reliability: node.reliability,
    reproducible: node.reproducible,
  })),
  listActive: () => graph.reusableCapabilities().map((node) => ({
    id: node.id,
    name: node.name,
    version: node.version,
    capabilities: ['verification'],
    dependencies: [],
    reliability: node.reliability,
    reproducible: node.reproducible,
  })),
};
const integrationManifest = compileCapability(
  'compile graph-backed capability',
  [{ id: 'verify', capability: 'verification', requiredVersion: '2.0.0' }],
  graphInventory,
  ['typecheck', 'unit-test', 'integration-test'],
  true,
  'capability:test:graph-integration',
);
const activation = activateCapability(
  {
    capabilityId: reproducible.id,
    manifestId: integrationManifest.id,
    proofRequired: true,
    reconciliationRequired: true,
    proofCriteria: integrationManifest.proofCriteria,
  },
  {
    proofId: 'proof:test:compiler',
    capabilityId: reproducible.id,
    verifiedAt: '2026-08-27T00:00:00.000Z',
    criteria: integrationManifest.proofCriteria,
    evidenceRefs: ['evidence:test:compiler'],
  },
  {
    authorized: true,
    authorizationId: 'auth:test:compiler',
    actor: 'phantom-self-test',
    reason: 'Automated compiler integration verification',
  },
  true,
  undefined,
  '2026-08-27T00:01:00.000Z',
);
assert(capabilityActivationSucceeded(activation), 'compiled capability must pass activation gates with valid proof');

const proofArtifact = {
  schema: 'phantom.capability-compiler.proof.v1',
  result: 'PASS',
  revision: process.env.GITHUB_SHA ?? 'local',
  command: 'npm run phantom:capability-compiler:self-test',
  configuration: {
    node: process.version,
    compiler: 'src/phantom/capability-compiler.ts',
    graph: 'src/phantom/capability-graph.ts',
    activation: 'src/phantom/capability-activation.ts',
  },
  checks: [
    'verified-active reuse',
    'inactive capability rejection',
    'dependency-first composition',
    'duplicate requirement rejection',
    'dependency-cycle rejection',
    'provisioning minimality',
    'Capability Graph integration',
    'activation proof gate',
  ],
};
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/capability-compiler-proof.json', `${JSON.stringify(proofArtifact, null, 2)}\n`, 'utf8');
console.log('capability-compiler self-test: PASS');
