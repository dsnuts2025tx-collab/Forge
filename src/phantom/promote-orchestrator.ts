/**
 * Phantom Promote orchestration primitives.
 * Provider-neutral: delivery adapters belong outside this control-plane layer.
 */

import {
  PromoteCampaign,
  CampaignMetric,
  validateCampaign,
  campaignCanClaimSuccess,
  type CampaignProof,
} from './promote';
import type { PromoteLedger } from './promote-ledger';

export type PromoteEvent =
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_READY'
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_PAUSED'
  | 'CAMPAIGN_COMPLETED'
  | 'CAMPAIGN_REJECTED'
  | 'METRICS_RECORDED'
  | 'PROOF_REQUIRED'
  | 'CAMPAIGN_PROVEN';

export interface PromoteAuditEvent {
  id: string;
  campaignId: string;
  event: PromoteEvent;
  occurredAt: string;
  actor: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface PromoteExecutionResult {
  campaign: PromoteCampaign;
  events: PromoteAuditEvent[];
  proofRequired: boolean;
}

function event(
  campaignId: string,
  type: PromoteEvent,
  actor: string,
  metadata?: Record<string, string | number | boolean>,
): PromoteAuditEvent {
  return {
    id: `${campaignId}:${type}:${Date.now()}`,
    campaignId,
    event: type,
    occurredAt: new Date().toISOString(),
    actor,
    metadata,
  };
}

function persist(events: PromoteAuditEvent[], ledger?: PromoteLedger, proof?: CampaignProof): void {
  if (!ledger) return;
  for (const auditEvent of events) {
    ledger.append({ event: auditEvent, ...(proof ? { proof } : {}) });
  }
}

export function prepareCampaign(
  campaign: PromoteCampaign,
  actor = 'phantom.promote',
  ledger?: PromoteLedger,
): PromoteExecutionResult {
  const validated = validateCampaign(campaign);
  const events: PromoteAuditEvent[] = [
    event(validated.id, 'CAMPAIGN_CREATED', actor),
  ];

  if (validated.status === 'READY' || validated.status === 'ACTIVE') {
    events.push(event(validated.id, 'CAMPAIGN_READY', actor));
  }
  if (validated.status === 'ACTIVE') {
    events.push(event(validated.id, 'CAMPAIGN_STARTED', actor));
  }

  persist(events, ledger);
  return { campaign: validated, events, proofRequired: true };
}

/** Records observed metrics; success remains fail-closed until proof is supplied. */
export function recordMetrics(
  campaign: PromoteCampaign,
  metric: CampaignMetric,
  actor = 'phantom.analytics',
  ledger?: PromoteLedger,
): PromoteExecutionResult {
  const validated = validateCampaign(campaign);
  const metricMetadata = {
    impressions: metric.impressions ?? 0,
    clicks: metric.clicks ?? 0,
    conversions: metric.conversions ?? 0,
    spendCents: metric.spendCents ?? 0,
    attributedRevenueCents: metric.attributedRevenueCents ?? 0,
  };
  const events = [
    event(validated.id, 'METRICS_RECORDED', actor, metricMetadata),
    event(validated.id, 'PROOF_REQUIRED', actor),
  ];
  persist(events, ledger);
  return { campaign: validated, events, proofRequired: true };
}

/**
 * Attaches an explicit evidence record to observed metrics. Only verified
 * proof can transition the orchestration result from PROOF_REQUIRED to proven.
 */
export function recordVerifiedMetrics(
  campaign: PromoteCampaign,
  metric: CampaignMetric,
  proof: CampaignProof,
  actor = 'phantom.proof',
  ledger?: PromoteLedger,
): PromoteExecutionResult {
  const validated = validateCampaign(campaign);
  const proven = campaignCanClaimSuccess(validated, metric, proof);
  const metricMetadata = {
    impressions: metric.impressions ?? 0,
    clicks: metric.clicks ?? 0,
    conversions: metric.conversions ?? 0,
    spendCents: metric.spendCents ?? 0,
    attributedRevenueCents: metric.attributedRevenueCents ?? 0,
  };

  const events = [
    event(validated.id, 'METRICS_RECORDED', actor, metricMetadata),
    ...(proven
      ? [event(validated.id, 'CAMPAIGN_PROVEN', actor, { evidenceId: proof.evidenceId, source: proof.source })]
      : [event(validated.id, 'PROOF_REQUIRED', actor)]),
  ];
  persist(events, ledger, proof);

  return {
    campaign: validated,
    events,
    proofRequired: !proven,
  };
}
