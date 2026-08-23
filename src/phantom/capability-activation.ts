/**
 * Phantom Mastermind capability activation gate.
 *
 * Activation is deliberately separate from compilation and infrastructure
 * mutation. A capability may be planned and provisioned without becoming active
 * until the required proof, reconciliation result, and authorization are all
 * present. This keeps the reusable capability graph honest: only verified
 * capabilities may be promoted into the active inventory.
 */

export type CapabilityActivationStatus =
  | 'PROOF_REQUIRED'
  | 'RECONCILIATION_REQUIRED'
  | 'AUTHORIZATION_REQUIRED'
  | 'ACTIVATED'
  | 'REJECTED';

export interface CapabilityActivationProof {
  proofId: string;
  capabilityId: string;
  verifiedAt: string;
  criteria: string[];
  evidenceRefs: string[];
}

export interface CapabilityActivationAuthorization {
  authorized: boolean;
  authorizationId: string;
  actor: string;
  reason: string;
}

export interface CapabilityActivationRequest {
  capabilityId: string;
  manifestId: string;
  proofRequired: boolean;
  reconciliationRequired: boolean;
  /** When supplied, proof must explicitly satisfy every declared criterion. */
  proofCriteria?: string[];
}

export interface CapabilityActivationResult {
  status: CapabilityActivationStatus;
  capabilityId: string;
  manifestId: string;
  activatedAt?: string;
  proofId?: string;
  authorizationId?: string;
  reason: string;
}

export interface CapabilityActivationSink {
  record(result: CapabilityActivationResult): void;
}

function validTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function criteriaSatisfied(required: string[], supplied: string[]): boolean {
  const suppliedCriteria = new Set(supplied.map((criterion) => criterion.trim()).filter(Boolean));
  return required.every((criterion) => suppliedCriteria.has(criterion.trim()));
}

/**
 * Activates a capability only after every declared gate has passed. The sink is
 * injected so activation records remain provider-neutral and auditable.
 */
export function activateCapability(
  request: CapabilityActivationRequest,
  proof: CapabilityActivationProof | undefined,
  authorization: CapabilityActivationAuthorization,
  reconciled: boolean,
  sink?: CapabilityActivationSink,
  now: string = new Date().toISOString(),
): CapabilityActivationResult {
  const base = {
    capabilityId: request.capabilityId,
    manifestId: request.manifestId,
  };

  let result: CapabilityActivationResult;

  if (!authorization.authorized) {
    result = {
      ...base,
      status: 'AUTHORIZATION_REQUIRED',
      reason: 'Explicit authorization is required before capability activation.',
    };
  } else if (!authorization.authorizationId || !authorization.actor || !authorization.reason) {
    result = {
      ...base,
      status: 'AUTHORIZATION_REQUIRED',
      reason: 'Authorization identity, actor, and reason are required.',
    };
  } else if (request.reconciliationRequired && !reconciled) {
    result = {
      ...base,
      status: 'RECONCILIATION_REQUIRED',
      authorizationId: authorization.authorizationId,
      reason: 'Canonical desired state has not been reconciled and verified.',
    };
  } else if (request.proofRequired && !proof) {
    result = {
      ...base,
      status: 'PROOF_REQUIRED',
      authorizationId: authorization.authorizationId,
      reason: 'Required capability proof has not been supplied.',
    };
  } else if (proof && (
    proof.capabilityId !== request.capabilityId
    || !proof.proofId
    || !validTimestamp(proof.verifiedAt)
    || proof.criteria.length === 0
    || proof.evidenceRefs.length === 0
    || !criteriaSatisfied(request.proofCriteria ?? [], proof.criteria)
  )) {
    result = {
      ...base,
      status: 'REJECTED',
      authorizationId: authorization.authorizationId,
      reason: 'Capability proof is incomplete, does not satisfy declared criteria, or is invalid.',
    };
  } else if (!validTimestamp(now)) {
    result = {
      ...base,
      status: 'REJECTED',
      authorizationId: authorization.authorizationId,
      reason: 'Activation timestamp is invalid.',
    };
  } else if (proof && Date.parse(proof.verifiedAt) > Date.parse(now)) {
    result = {
      ...base,
      status: 'REJECTED',
      authorizationId: authorization.authorizationId,
      reason: 'Capability proof cannot be verified after activation time.',
    };
  } else {
    result = {
      ...base,
      status: 'ACTIVATED',
      activatedAt: now,
      proofId: proof?.proofId,
      authorizationId: authorization.authorizationId,
      reason: 'Capability passed authorization, reconciliation, and proof gates.',
    };
  }

  sink?.record({ ...result });
  return result;
}

export function capabilityActivationSucceeded(
  result: CapabilityActivationResult,
): boolean {
  return result.status === 'ACTIVATED' && Boolean(result.activatedAt);
}
