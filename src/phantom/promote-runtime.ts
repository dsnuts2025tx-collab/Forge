/**
 * Phantom Promote runtime boundary.
 *
 * The control plane owns lifecycle, authorization gates, accounting semantics,
 * and audit events. Delivery, billing, inventory, and execution-guard
 * implementations are injected at the boundary so no third-party service
 * becomes foundational.
 */

import type { PromoteCampaign, CampaignStatus } from './promote';
import type { PromoteLedger } from './promote-ledger';
import type { PromoteAuditEvent } from './promote-orchestrator';

export interface PromoteExecutionReceipt {
  executionId: string;
  campaignId: string;
  startedAt: string;
  completedAt?: string;
  status: 'STARTED' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  externalReference?: string;
}

export interface PromoteDeliveryAdapter {
  start(campaign: PromoteCampaign): Promise<{ externalReference?: string }>;
  pause(campaign: PromoteCampaign): Promise<void>;
  complete(campaign: PromoteCampaign): Promise<void>;
}

export interface PromoteBillingAdapter {
  authorize(campaign: PromoteCampaign): Promise<void>;
  release(campaign: PromoteCampaign): Promise<void>;
}

export interface PromoteInventoryAdapter {
  reserve(campaign: PromoteCampaign): Promise<void>;
  release(campaign: PromoteCampaign): Promise<void>;
}

/**
 * Guards a logical execution key against duplicate execution.
 *
 * `claim` must be atomic in a production implementation. `release` is only
 * used when execution fails before the operation has been committed.
 */
export interface PromoteExecutionGuard {
  claim(key: string): boolean;
  release(key: string): void;
}

export interface PromoteRuntimeAdapters {
  delivery: PromoteDeliveryAdapter;
  billing: PromoteBillingAdapter;
  inventory: PromoteInventoryAdapter;
  executionGuard?: PromoteExecutionGuard;
}

export interface PromoteRuntimeResult {
  campaign: PromoteCampaign;
  receipt: PromoteExecutionReceipt;
  events: PromoteAuditEvent[];
}

/** Reference guard for local/tests. Production may inject a durable Phantom-owned guard. */
export class InMemoryPromoteExecutionGuard implements PromoteExecutionGuard {
  private readonly claimed = new Set<string>();

  claim(key: string): boolean {
    if (this.claimed.has(key)) return false;
    this.claimed.add(key);
    return true;
  }

  release(key: string): void {
    this.claimed.delete(key);
  }
}

const defaultExecutionGuard = new InMemoryPromoteExecutionGuard();
let executionSequence = 0;

function executionId(campaignId: string): string {
  executionSequence = (executionSequence + 1) % 1_000_000_000;
  return `promote:${campaignId}:${Date.now().toString(36)}:${executionSequence.toString(36).padStart(7, '0')}`;
}

function transition(campaign: PromoteCampaign, next: CampaignStatus): PromoteCampaign {
  const allowed: Record<CampaignStatus, CampaignStatus[]> = {
    DRAFT: ['READY', 'REJECTED'],
    READY: ['ACTIVE', 'REJECTED'],
    ACTIVE: ['PAUSED', 'COMPLETED'],
    PAUSED: ['ACTIVE', 'COMPLETED', 'REJECTED'],
    COMPLETED: [],
    REJECTED: [],
  };

  if (!allowed[campaign.status].includes(next)) {
    throw new Error(`Invalid Promote lifecycle transition: ${campaign.status} -> ${next}`);
  }
  return { ...campaign, status: next };
}

function audit(
  campaignId: string,
  event: PromoteAuditEvent['event'],
  actor: string,
  metadata?: Record<string, string | number | boolean>,
): PromoteAuditEvent {
  executionSequence = (executionSequence + 1) % 1_000_000_000;
  return {
    id: `runtime:${campaignId}:${event}:${Date.now().toString(36)}:${executionSequence.toString(36).padStart(7, '0')}`,
    campaignId,
    event,
    occurredAt: new Date().toISOString(),
    actor,
    metadata,
  };
}

function persist(events: PromoteAuditEvent[], ledger?: PromoteLedger): void {
  if (!ledger) return;
  for (const event of events) ledger.append({ event });
}

function claimExecution(adapters: PromoteRuntimeAdapters, key: string): PromoteExecutionGuard {
  const guard = adapters.executionGuard ?? defaultExecutionGuard;
  if (!guard.claim(key)) {
    throw new Error(`Duplicate Promote execution rejected: ${key}`);
  }
  return guard;
}

/**
 * Starts delivery only after budget authorization and inventory reservation.
 * If delivery fails, reserved inventory, authorized budget, and the execution
 * claim are released so a safe retry remains possible.
 */
export async function startCampaign(
  campaign: PromoteCampaign,
  adapters: PromoteRuntimeAdapters,
  actor = 'phantom.promote.runtime',
  ledger?: PromoteLedger,
): Promise<PromoteRuntimeResult> {
  const guard = claimExecution(adapters, `start:${campaign.id}`);
  const ready = transition(campaign, 'READY');
  await adapters.billing.authorize(ready);
  try {
    await adapters.inventory.reserve(ready);
    const delivery = await adapters.delivery.start(ready);
    const active = transition(ready, 'ACTIVE');
    const startedAt = new Date().toISOString();
    const receipt: PromoteExecutionReceipt = {
      executionId: executionId(active.id),
      campaignId: active.id,
      startedAt,
      status: 'STARTED',
      ...(delivery.externalReference ? { externalReference: delivery.externalReference } : {}),
    };
    const events = [
      audit(active.id, 'CAMPAIGN_READY', actor),
      audit(active.id, 'CAMPAIGN_STARTED', actor, delivery.externalReference ? { externalReference: delivery.externalReference } : undefined),
    ];
    persist(events, ledger);
    return { campaign: active, receipt, events };
  } catch (error) {
    await adapters.inventory.release(ready).catch(() => undefined);
    await adapters.billing.release(ready).catch(() => undefined);
    guard.release(`start:${campaign.id}`);
    throw error;
  }
}

export async function pauseCampaign(
  campaign: PromoteCampaign,
  adapters: PromoteRuntimeAdapters,
  actor = 'phantom.promote.runtime',
  ledger?: PromoteLedger,
): Promise<PromoteRuntimeResult> {
  const key = `pause:${campaign.id}`;
  const guard = claimExecution(adapters, key);
  try {
    const paused = transition(campaign, 'PAUSED');
    await adapters.delivery.pause(campaign);
    const receipt: PromoteExecutionReceipt = {
      executionId: executionId(paused.id),
      campaignId: paused.id,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'PAUSED',
    };
    const events = [audit(paused.id, 'CAMPAIGN_PAUSED', actor)];
    persist(events, ledger);
    return { campaign: paused, receipt, events };
  } catch (error) {
    guard.release(key);
    throw error;
  }
}

export async function completeCampaign(
  campaign: PromoteCampaign,
  adapters: PromoteRuntimeAdapters,
  actor = 'phantom.promote.runtime',
  ledger?: PromoteLedger,
): Promise<PromoteRuntimeResult> {
  const key = `complete:${campaign.id}`;
  const guard = claimExecution(adapters, key);
  try {
    const completed = transition(campaign, 'COMPLETED');
    await adapters.delivery.complete(campaign);
    await adapters.inventory.release(campaign);
    await adapters.billing.release(campaign);
    const receipt: PromoteExecutionReceipt = {
      executionId: executionId(completed.id),
      campaignId: completed.id,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'COMPLETED',
    };
    const events = [audit(completed.id, 'CAMPAIGN_COMPLETED', actor)];
    persist(events, ledger);
    return { campaign: completed, receipt, events };
  } catch (error) {
    guard.release(key);
    throw error;
  }
}
