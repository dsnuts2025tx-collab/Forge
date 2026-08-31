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

const verifiedEvidence: DeploymentEvidence = {
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
  independentVerificationPassed: true,
  notes: ["Reference self-test only; no production mutation performed."],
};

assertProductionReleaseAllowed(manifest, verifiedEvidence);
const record = createDeploymentRecord(manifest, verifiedEvidence);

if (
  record.status !== "verified" ||
  record.environment !== "production" ||
  record.independentVerificationPassed !== true
) {
  throw new Error("Production control surface self-test failed.");
}

const blockedEvidence: DeploymentEvidence = {
  ...verifiedEvidence,
  independentVerificationPassed: false,
};

let blocked = false;
try {
  assertProductionReleaseAllowed(manifest, blockedEvidence);
} catch (error) {
  blocked = error instanceof Error && error.message.includes("independent verification");
}

if (!blocked) throw new Error("Production control surface failed to block missing independent verification.");

console.log("Phantom production control surface self-test: PASS");
