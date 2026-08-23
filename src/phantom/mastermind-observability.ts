/**
 * Phantom Mastermind observability integration.
 *
 * Couples drift/recovery execution to the canonical audit boundary without
 * coupling either subsystem to a vendor telemetry or storage implementation.
 */

import {
  recoverInfrastructure,
  type InfrastructureRecoveryReceipt,
} from './infrastructure-recovery';
import type {
  InfrastructureAuthorization,
  InfrastructureControllerAdapter,
} from './infrastructure-controller';
import type { CanonicalDesiredState } from './desired-state';
import {
  recordInfrastructureRecovery,
  type MastermindAuditEvent,
  type MastermindAuditSink,
} from './mastermind-audit';

export interface MastermindRecoveryExecutionContext {
  actor: string;
  correlationId: string;
}

export interface MastermindRecoveryExecutionResult {
  recovery: InfrastructureRecoveryReceipt;
  audit: MastermindAuditEvent;
}

/** Execute authorized recovery and make the resulting evidence auditable. */
export function executeAndAuditInfrastructureRecovery(
  desired: CanonicalDesiredState,
  authorization: InfrastructureAuthorization,
  adapter: InfrastructureControllerAdapter,
  auditSink: MastermindAuditSink,
  context: MastermindRecoveryExecutionContext,
): MastermindRecoveryExecutionResult {
  const recovery = recoverInfrastructure(desired, authorization, adapter);
  const audit = recordInfrastructureRecovery(auditSink, recovery, context);
  return { recovery, audit };
}
