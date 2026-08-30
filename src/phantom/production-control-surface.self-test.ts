import {
  assertProductionReleaseAllowed,
  createDeploymentRecord,
  type DeploymentEvidence,
  type ReleaseManifest,
} from "./production-control-surface.ts";

const manifest: ReleaseManifest = {
  releaseId: "self-test-release",
  product: "phantom-insight",
  version: "0.0.0-self-test",
  environment: "production",
  artifactDigest: "sha256:self-test",
  sourceRevision: "self-test",
  requestedBy: "self-test",
  createdAt: new Date().toISOString(),
};

const evidence: DeploymentEvidence = {
  releaseId: manifest.releaseId,
  status: "verified",
  startedAt: manifest.createdAt,
  completedAt: new Date().toISOString(),
  endpoint: "https://production.invalid/self-test",
  healthCheckPassed: true,
  smokeTestPassed: true,
  artifactVerified: true,
  authorizationVerified: true,
  rollbackReady: true,
  notes: ["Reference self-test only; no production mutation performed."],
};

assertProductionReleaseAllowed(manifest, evidence);
const record = createDeploymentRecord(manifest, evidence);

if (record.status !== "verified" || record.environment !== "production") {
  throw new Error("Production control surface self-test failed.");
}

console.log("Phantom production control surface self-test: PASS");
