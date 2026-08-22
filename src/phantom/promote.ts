/** Phantom Promote domain primitives. Keeps advertising semantics provider-neutral. */

import { evaluateCampaignProof, type CampaignProof } from './promote-proof';

export const PROMOTE_CAPABILITIES = [
  'ads.strategy','ads.creative','ads.targeting','ads.budgeting','ads.delivery',
  'ads.analytics','ads.experimentation','ads.optimization','ads.compliance',
  'ads.inventory','ads.billing',
] as const;

export type PromoteCapability = typeof PROMOTE_CAPABILITIES[number];
export type CampaignStatus = 'DRAFT'|'READY'|'ACTIVE'|'PAUSED'|'COMPLETED'|'REJECTED';
export type InventoryType = 'PHANTOM_OWNED'|'AUTHORIZED_PARTNER';

export interface CampaignObjective {
  type: 'AWARENESS'|'TRAFFIC'|'LEADS'|'CONVERSIONS'|'REVENUE'|'CUSTOM';
  target?: string;
  successCriteria?: string[];
}

export interface PromoteCampaign {
  id: string;
  advertiserId: string;
  name: string;
  objective: CampaignObjective;
  budgetCents: number;
  currency: string;
  status: CampaignStatus;
  inventory: InventoryType[];
  createdAt: string;
}

export interface CampaignMetric {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spendCents?: number;
  attributedRevenueCents?: number;
}

export { evaluateCampaignProof };
export type { CampaignProof };

export function validateCampaign(campaign: PromoteCampaign): PromoteCampaign {
  if (!campaign.id || !campaign.advertiserId || !campaign.name) throw new Error('Campaign identity is required');
  if (!Number.isInteger(campaign.budgetCents) || campaign.budgetCents < 0) throw new Error('budgetCents must be a non-negative integer');
  if (!/^[A-Z]{3}$/.test(campaign.currency)) throw new Error('currency must be an ISO-style 3-letter code');
  if (!campaign.inventory.length) throw new Error('At least one inventory type is required');
  return campaign;
}

export function calculateRoas(metric: CampaignMetric): number | null {
  if (!metric.spendCents || metric.spendCents <= 0 || metric.attributedRevenueCents == null) return null;
  return metric.attributedRevenueCents / metric.spendCents;
}

export function campaignCanClaimSuccess(
  campaign: PromoteCampaign,
  metric: CampaignMetric,
  proof?: CampaignProof,
): boolean {
  if (campaign.status !== 'COMPLETED') return false;
  const criteria = campaign.objective.successCriteria ?? [];
  if (!criteria.length || !proof) return false;
  return evaluateCampaignProof(campaign, metric, proof).verified;
}
