/**
 * Provider-neutral proof gate for Phantom Promote.
 * A campaign can only claim success when an explicit evidence record
 * verifies the declared success criteria for the completed campaign.
 */

import type { CampaignMetric, PromoteCampaign } from './promote';

export interface CampaignProof {
  campaignId: string;
  evidenceId: string;
  source: string;
  observedAt: string;
  verifiedAt: string;
  criteriaSatisfied: string[];
  metricSnapshot: CampaignMetric;
  attestation: 'VERIFIED' | 'REJECTED';
}

export interface CampaignProofResult {
  verified: boolean;
  reasons: string[];
}

function parseTimestamp(value: string): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameMetricSnapshot(expected: CampaignMetric, observed: CampaignMetric): boolean {
  const keys: (keyof CampaignMetric)[] = [
    'impressions', 'clicks', 'conversions', 'spendCents', 'attributedRevenueCents',
  ];
  return keys.every((key) => expected[key] === observed[key]);
}

export function evaluateCampaignProof(
  campaign: PromoteCampaign,
  metric: CampaignMetric,
  proof: CampaignProof,
): CampaignProofResult {
  const reasons: string[] = [];
  const criteria = campaign.objective.successCriteria ?? [];
  const observedAt = parseTimestamp(proof.observedAt);
  const verifiedAt = parseTimestamp(proof.verifiedAt);

  if (campaign.status !== 'COMPLETED') reasons.push('campaign is not completed');
  if (!criteria.length) reasons.push('no declared success criteria');
  if (proof.attestation !== 'VERIFIED') reasons.push('evidence attestation is not verified');
  if (proof.campaignId !== campaign.id) reasons.push('evidence belongs to a different campaign');
  if (!proof.evidenceId || !proof.source) reasons.push('evidence identity/source is required');
  if (observedAt === null) reasons.push('observedAt must be a valid timestamp');
  if (verifiedAt === null) reasons.push('verifiedAt must be a valid timestamp');
  if (observedAt !== null && verifiedAt !== null && verifiedAt < observedAt) {
    reasons.push('verifiedAt cannot precede observedAt');
  }
  if (!sameMetricSnapshot(metric, proof.metricSnapshot)) reasons.push('evidence metric snapshot does not match reported metrics');

  const satisfied = new Set(proof.criteriaSatisfied);
  for (const criterion of criteria) {
    if (!satisfied.has(criterion)) reasons.push(`success criterion not evidenced: ${criterion}`);
  }

  return { verified: reasons.length === 0, reasons };
}
