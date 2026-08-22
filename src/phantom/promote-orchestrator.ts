/**
 * Phantom Promote orchestration primitives.
 * Provider-neutral: delivery adapters belong outside this control-plane layer.
 */

import {
  PromoteCampaign,
  CampaignMetric,
  validateCampaign,
  campaignCanClaimSuccess,
} from './promote';

export type PromoteEvent =
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_READY'
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_PAUSED'
  | 'CAMPAIGN_COMPLETED'
  | 'CAMPAIGN_REJECTED'
  | 'METRICS_RECORDED'
  | 'PROOF_REQUIRED';

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

/**
 * Validates a campaign and produces the minimum auditable lifecycle needed
 * before a delivery adapter is allowed to execute it.
 */
export function prepareCampaign(
  campaign: PromoteCampaign,
  actor = 'phantom.promote',
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

  return { campaign: validated, events, proofRequired: true };
}

/**
 * Records observed metrics without manufacturing success. A separate proof
 * layer must evaluate objective criteria and attach evidence.
 */
export function recordMetrics(
  campaign: PromoteCampaign,
  metric: CampaignMetric,
  actor = 'phantom.analytics',
): PromoteExecutionResult {
  const validated = validateCampaign(campaign);
  const proofRequired = !campaignCanClaimSuccess(validated, metric);
  return {
    campaign: validated,
    events: [
      event(validated.id, 'METRICS_RECORDED', actor, {
        impressions: metric.impressions ?? 0,
        clicks: metric.clicks ?? 0,
        conversions: metric.conversions ?? 0,
        spendCents: metric.spendCents ?? 0,
        attributedRevenueCents: metric.attributedRevenueCents ?? 0,
      }),
      ...(proofRequired ? [event(validated.id, 'PROOF_REQUIRED', actor)] : []),
    ],
    proofRequired,
  };
}
