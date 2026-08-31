/**
 * Phantom Production Control Surface
 *
 * Vendor-neutral control-plane contract/reference implementation.
 * It is intentionally not a GitHub Actions, Vercel, or Cloudflare authority.
 * A physical deployment adapter must satisfy this boundary before production
 * mutation is permitted.
 */

export type Environment = "development" | "staging" | "production";

export type ReleaseStatus =
  | "proposed"
  | "validated"
  | "authorized"
  | "deploying"
  | "deployed"
  | "verified"
  | "failed"
  | "rolled_back";

export interface ReleaseManifest {
  releaseId: string;
  product: string;
  version: string;
  environment: Environment;
  artifactDigest: string;
  sourceRevision: string;
  requestedBy: string;
  createdAt: string;
  rollbackTarget?: string;
}

export interface DeploymentEvidence {
  releaseId: string;
  status: ReleaseStatus;
  startedAt: string;
  completedAt?: string;
  endpoint?: string;
  healthCheckPassed: boolean;
  smokeTestPassed: boolean;
  artifactVerified: boolean;
  authorizationVerified: boolean;
  rollbackReady: boolean;
  independentVerificationPassed: boolean;
  notes: string[];
}

export interface DeploymentAdapter {
  validate(manifest: ReleaseManifest): Promise<void>;
  deploy(manifest: ReleaseManifest): Promise<DeploymentEvidence>;
  verify(manifest: ReleaseManifest, evidence: DeploymentEvidence): Promise<DeploymentEvidence>;
  rollback(manifest: ReleaseManifest): Promise<DeploymentEvidence>;
}

export interface DeploymentPolicy {
  productionRequiresAuthorization: boolean;
  productionRequiresArtifactVerification: boolean;
  productionRequiresRollbackReady: boolean;
  productionRequiresIndependentVerification: boolean;
  productionRequiresHealthCheck: boolean;
  productionRequiresSmokeTest: boolean;
}

export const DEFAULT_DEPLOYMENT_POLICY: DeploymentPolicy = {
  productionRequiresAuthorization: true,
  productionRequiresArtifactVerification: true,
  productionRequiresRollbackReady: true,
  productionRequiresIndependentVerification: true,
  productionRequiresHealthCheck: true,
  productionRequiresSmokeTest: true,
};

export function assertProductionReleaseAllowed(
  manifest: ReleaseManifest,
  evidence: DeploymentEvidence,
  policy: DeploymentPolicy = DEFAULT_DEPLOYMENT_POLICY,
): void {
  if (manifest.environment !== "production") return;

  if (evidence.releaseId !== manifest.releaseId) {
    throw new Error("Production release blocked: evidence/release identity mismatch.");
  }

  if (policy.productionRequiresAuthorization && !evidence.authorizationVerified) {
    throw new Error("Production release blocked: authorization evidence missing.");
  }

  if (policy.productionRequiresArtifactVerification && !evidence.artifactVerified) {
    throw new Error("Production release blocked: artifact verification missing.");
  }

  if (policy.productionRequiresRollbackReady && !evidence.rollbackReady) {
    throw new Error("Production release blocked: rollback readiness missing.");
  }

  if (policy.productionRequiresHealthCheck && !evidence.healthCheckPassed) {
    throw new Error("Production release blocked: health-check evidence missing.");
  }

  if (policy.productionRequiresSmokeTest && !evidence.smokeTestPassed) {
    throw new Error("Production release blocked: smoke-test evidence missing.");
  }

  if (policy.productionRequiresIndependentVerification && !evidence.independentVerificationPassed) {
    throw new Error("Production release blocked: independent verification not complete.");
  }

  if (policy.productionRequiresIndependentVerification && evidence.status !== "verified") {
    throw new Error("Production release blocked: verification status not complete.");
  }
}

export function createDeploymentRecord(
  manifest: ReleaseManifest,
  evidence: DeploymentEvidence,
) {
  return {
    releaseId: manifest.releaseId,
    product: manifest.product,
    version: manifest.version,
    environment: manifest.environment,
    artifactDigest: manifest.artifactDigest,
    sourceRevision: manifest.sourceRevision,
    status: evidence.status,
    endpoint: evidence.endpoint ?? null,
    healthCheckPassed: evidence.healthCheckPassed,
    smokeTestPassed: evidence.smokeTestPassed,
    artifactVerified: evidence.artifactVerified,
    authorizationVerified: evidence.authorizationVerified,
    rollbackReady: evidence.rollbackReady,
    independentVerificationPassed: evidence.independentVerificationPassed,
    createdAt: manifest.createdAt,
    completedAt: evidence.completedAt ?? null,
  };
}
