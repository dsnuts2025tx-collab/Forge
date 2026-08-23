/**
 * Phantom Mastermind active-capability health controller.
 *
 * An active capability is not permanently trusted. This boundary re-checks the
 * proof and reconciliation conditions that justified activation and can revoke
 * the active registration through an explicit authorization gate when those
 * conditions are no longer true.
 */

import {
  recordCapabilityHealthChecked,
  recordCapabilityRevoked,
  type MastermindAuditSink,
  type MastermindControlAuditContext,
} from './mastermind-audit';
import {
  ActiveCapabilityRegistry,
  type ActiveCapabilityPersistence,
} from './active-capability-registry';
import type {
  CapabilityActivationAuthorization,
  CapabilityActivationProof,
} from './capability-activation';

export type CapabilityHealthStatus =
  | 'HEALTHY'
  | 'PROOF_REQUIRED'
  | 'RECONCILIATION_REQUIRED'
  | 'REVOKED'
  | 'NOT_ACTIVE';

export interface CapabilityHealthResult {
  capabilityId: string;
  status: CapabilityHealthStatus;
  reason: string;
  proofId?: string;
  authorizationId?: string;
  checkedAt: string;
}

function validTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function criteriaSatisfied(required: string[], supplied: string[]): boolean {
  const suppliedCriteria = new Set(supplied.map((criterion) => criterion.trim()).filter(Boolean));
  return required.every((criterion) => suppliedCriteria.has(criterion.trim()));
}

function recordHealth(
  result: CapabilityHealthResult,
  audit: MastermindAuditSink | undefined,
  context: MastermindControlAuditContext | undefined,
): void {
  if (audit && context) recordCapabilityHealthChecked(audit, result, context);
}

/**
 * Revalidates an active capability. Failed health does not silently disappear:
 * it requires explicit authorization before the active registry is revoked.
 * When an audit sink/context is supplied, every health decision is recorded.
 */
export function verifyActiveCapability(
  capabilityId: string,
  proof: CapabilityActivationProof | undefined,
  proofCriteria: string[],
  reconciled: boolean,
  authorization: CapabilityActivationAuthorization,
  registry: ActiveCapabilityRegistry,
  persistence?: ActiveCapabilityPersistence,
  now: string = new Date().toISOString(),
  audit?: MastermindAuditSink,
  auditContext?: MastermindControlAuditContext,
): CapabilityHealthResult {
  if (!validTimestamp(now)) throw new Error('Capability health check timestamp is invalid');

  const active = registry.get(capabilityId);
  if (!active) {
    const result: CapabilityHealthResult = {
      capabilityId,
      status: 'NOT_ACTIVE',
      reason: 'Capability is not present in the active registry.',
      checkedAt: now,
    };
    recordHealth(result, audit, auditContext);
    return result;
  }

  if (!reconciled) {
    if (!authorization.authorized || !authorization.authorizationId || !authorization.actor || !authorization.reason) {
      const result: CapabilityHealthResult = {
        capabilityId,
        status: 'RECONCILIATION_REQUIRED',
        reason: 'Canonical desired state is not reconciled; explicit authorization is required to revoke the active capability.',
        proofId: active.proofId,
        checkedAt: now,
      };
      recordHealth(result, audit, auditContext);
      return result;
    }
    registry.deactivate(capabilityId, authorization, persistence);
    const result: CapabilityHealthResult = {
      capabilityId,
      status: 'REVOKED',
      reason: 'Capability was revoked because canonical desired state is no longer reconciled.',
      proofId: active.proofId,
      authorizationId: authorization.authorizationId,
      checkedAt: now,
    };
    if (audit && auditContext) recordCapabilityRevoked(audit, result, auditContext);
    return result;
  }

  if (!proof) {
    const result: CapabilityHealthResult = {
      capabilityId,
      status: 'PROOF_REQUIRED',
      reason: 'Current capability proof is required to retain active status.',
      proofId: active.proofId,
      checkedAt: now,
    };
    recordHealth(result, audit, auditContext);
    return result;
  }

  const proofValid = proof.capabilityId === capabilityId
    && proof.proofId === active.proofId
    && validTimestamp(proof.verifiedAt)
    && proof.criteria.length > 0
    && proof.evidenceRefs.length > 0
    && criteriaSatisfied(proofCriteria, proof.criteria)
    && Date.parse(proof.verifiedAt) <= Date.parse(now);

  if (!proofValid) {
    if (!authorization.authorized || !authorization.authorizationId || !authorization.actor || !authorization.reason) {
      const result: CapabilityHealthResult = {
        capabilityId,
        status: 'PROOF_REQUIRED',
        reason: 'Current proof is invalid or does not satisfy declared criteria; explicit authorization is required to revoke the active capability.',
        proofId: active.proofId,
        checkedAt: now,
      };
      recordHealth(result, audit, auditContext);
      return result;
    }
    registry.deactivate(capabilityId, authorization, persistence);
    const result: CapabilityHealthResult = {
      capabilityId,
      status: 'REVOKED',
      reason: 'Capability was revoked because current proof failed integrity or declared proof criteria.',
      proofId: active.proofId,
      authorizationId: authorization.authorizationId,
      checkedAt: now,
    };
    if (audit && auditContext) recordCapabilityRevoked(audit, result, auditContext);
    return result;
  }

  const result: CapabilityHealthResult = {
    capabilityId,
    status: 'HEALTHY',
    reason: 'Capability remains active with reconciled state and valid current proof.',
    proofId: active.proofId,
    checkedAt: now,
  };
  recordHealth(result, audit, auditContext);
  return result;
}
