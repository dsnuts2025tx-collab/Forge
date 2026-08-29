/**
 * Phantom Production Control Surface
 *
 * This is a vendor-neutral control-plane contract/reference implementation.
 * It is intentionally not GitHub Actions, Vercel, or Cloudflare-specific.
 * A physical deployment adapter must implement the boundary before production
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
}

export const DEFAULT_DEPLOYMENT_POLICY: DeploymentPolicy = {
  productionRequiresAuthorization: true,
  productionRequiresArtifactVerification: true,
  productionRequiresRollbackReady: true,
  productionRequiresIndependentVerification: true,
};

export function assertProductionReleaseAllowed(
  manifest: ReleaseManifest,
  evidence: DeploymentEvidence,
  policy: DeploymentPolicy = DEFAULT_DEPLOYMENT_POLICY,
): void {
  if (manifest.environment !== "production") return;

  if (policy.productionRequiresAuthorization && !evidence.authorizationVerified) {
    throw new Error("Production release blocked: authorization evidence missing.");
  }

  if (policy.productionRequiresArtifactVerification && !evidence.artifactVerified) {
    throw new Error("Production release blocked: artifact verification missing.");
  }

  if (policy.productionRequiresRollbackReady && !evidence.rollbackReady) {
    throw new Error("Production release blocked: rollback readiness missing.");
  }

  if (policy.productionRequiresIndependentVerification && evidence.status !== "verified") {
    throw new Error("Production release blocked: independent verification not complete.");
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
    createdAt: manifest.createdAt,
    completedAt: evidence.completedAt ?? null,
  };
}
