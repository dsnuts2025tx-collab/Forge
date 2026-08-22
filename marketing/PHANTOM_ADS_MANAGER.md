# Phantom Ads Manager

## Business model

Phantom operates as the advertising-management provider. The client remains the advertiser and, by default, pays the advertising platform directly for media spend. Phantom separately earns disclosed service revenue for managing the campaign.

This separation prevents Phantom from confusing media spend with company revenue and avoids unnecessary working-capital exposure from fronting client ad spend.

## Revenue streams

1. **Monthly management fee** — recurring fee for campaign strategy, setup, optimization, reporting, and management.
2. **Spend-based management fee** — disclosed percentage of verified media spend when included in the client's plan.
3. **Performance fee** — optional, explicitly contracted percentage of attributable revenue or another measurable outcome.
4. **Creative/production services** — optional separately priced services when Phantom creates ads, landing pages, video, graphics, or other campaign assets.

Every invoice should clearly distinguish:

- advertising/media spend;
- Phantom management/service fees;
- taxes or other applicable charges;
- credits/refunds;
- campaign period.

## Campaign lifecycle

```text
CLIENT
  ↓
SERVICE AGREEMENT + FEE PLAN
  ↓
CAMPAIGN DRAFT
  ↓
BUDGET + TRACKING CONFIGURATION
  ↓
CLIENT/PLATFORM AUTHORIZATION
  ↓
LAUNCH
  ↓
MEASURE
  ↓
OPTIMIZE
  ↓
PROVE RESULTS
  ↓
INVOICE PHANTOM FEES
  ↓
REINVEST / RETAIN / SCALE
```

## First-party architecture

The Ads Manager is a Phantom control-plane capability. Google Ads, Meta Ads, and future platforms are adapters. They provide media execution and performance data; Phantom owns campaign state, fee accounting, authorization policy, reporting, and business logic.

The platform must never represent media spend as Phantom revenue. Platform-specific costs and Phantom's service revenue remain separate ledger categories.

## Transparency requirement

Google's third-party advertising policy requires management fees to be clearly disclosed in advance and on customer invoices. Phantom's billing UI should therefore expose the fee plan before activation and retain the agreed fee configuration with the campaign record. citeturn0search10

## Google integration direction

A Google Ads Manager Account (MCC) is designed for agencies managing multiple client accounts and supports campaign management across linked accounts. Phantom should use an MCC integration as an adapter rather than making Google the system of record. citeturn0search1turn0search11

Where Google monthly invoicing/account budgets are used, billing responsibility and campaign budgets must be explicitly configured. Google's documentation distinguishes the client account budget from the manager's billing setup. citeturn0search0turn0search3

## Initial commercial configuration

The code-level engine supports a default model of:

- monthly management fee;
- percentage of verified media spend;
- optional performance fee;
- hard campaign media-spend ceiling;
- auditable financial snapshot.

Actual customer pricing should be configured per signed service agreement rather than silently imposed by the platform.
