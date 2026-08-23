/**
 * Phantom Mastermind capability lifecycle integration.
 *
 * Connects the proof-gated activation boundary to the canonical active
 * capability registry. Activation is committed to the reusable inventory only
 * after the activation gate succeeds; rejected/blocked activations never become
 * active by accident.
 */

import {
  activateCapability,
  capabilityActivationSucceeded,
  type CapabilityActivationAuthorization,
  type CapabilityActivationProof,
  type CapabilityActivationRequest,
  type CapabilityActivationResult,
  type CapabilityActivationSink,
} from './capability-activation';
import {
  ActiveCapabilityRegistry,
  type ActiveCapabilityPersistence,
} from './active-capability-registry';

export interface CapabilityLifecycleResult {
  activation: CapabilityActivationResult;
  registered: boolean;
}

/**
 * Runs the canonical activation gate and, only after success, records the
 * capability in the active registry. Registry persistence remains injected so
 * no storage or infrastructure vendor becomes a foundational dependency.
 */
export function activateAndRegisterCapability(
  request: CapabilityActivationRequest,
  proof: CapabilityActivationProof | undefined,
  authorization: CapabilityActivationAuthorization,
  reconciled: boolean,
  registry: ActiveCapabilityRegistry,
  persistence?: ActiveCapabilityPersistence,
  sink?: CapabilityActivationSink,
  now: string = new Date().toISOString(),
): CapabilityLifecycleResult {
  const activation = activateCapability(
    request,
    proof,
    authorization,
    reconciled,
    sink,
    now,
  );

  if (!capabilityActivationSucceeded(activation)) {
    return { activation, registered: false };
  }

  if (!activation.proofId || !activation.authorizationId || !activation.activatedAt) {
    throw new Error('Successful capability activation is missing registry identity');
  }

  registry.activate({
    capabilityId: activation.capabilityId,
    manifestId: activation.manifestId,
    activatedAt: activation.activatedAt,
    proofId: activation.proofId,
    authorizationId: activation.authorizationId,
  }, persistence);

  return { activation, registered: true };
}
