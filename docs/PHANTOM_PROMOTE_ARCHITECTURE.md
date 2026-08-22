# Phantom Promote — Unified Advertising Business

**Status: LOCKED DIRECTION**

Phantom Promote is a first-class Phantom business capability combining campaign management, managed promotion, analytics, creative intelligence, and Phantom-owned advertising inventory.

## Product surface

### Promote Studio
- campaign creation and editing
- objectives, budgets, schedules and audiences
- creative asset management
- landing-page and conversion configuration
- A/B experiments
- campaign lifecycle controls

### Campaign Intelligence
Master Mind coordinates the Family to:
- analyze campaign goals
- generate and review creative
- recommend targeting and budget allocation
- monitor performance
- identify underperforming components
- propose and test improvements

### Managed Promotion
Customers may delegate campaign operation to Phantom. Management actions remain subject to campaign permissions, platform rules, advertising laws, and configured approval gates.

### Phantom Inventory
Phantom may sell placements on properties it actually owns or controls, including future websites, applications, media and discovery surfaces. Inventory ownership must be explicit in product metadata and contracts.

### Partner Inventory
Authorized third-party inventory may be supported through documented partnerships or APIs. Phantom must never represent partner inventory as Phantom-owned inventory.

## Revenue model

Support multiple commercial models:
- platform fee
- managed-service fee
- premium placement fee
- sponsored-content fee
- enterprise contract
- inventory revenue

All billable value must be backed by server-side entitlement and accounting records.

## Core execution loop

```text
ADVERTISER OBJECTIVE
→ MASTER MIND
→ FAMILY ASSEMBLY
→ CREATIVE / AUDIENCE / OFFER
→ CAMPAIGN
→ PROMOTE
→ MEASURE
→ PROVE
→ LEARN
→ OPTIMIZE
→ REPEAT
```

## PRL integration

Campaign lifecycle events should use Phantom Response Language (PRL) so advertising actions share the same semantic protocol as the rest of the platform.

Recommended capabilities:

```text
ads.strategy
ads.creative
ads.targeting
ads.budgeting
ads.delivery
ads.analytics
ads.experimentation
ads.optimization
ads.compliance
ads.inventory
ads.billing
```

## Proof and accountability

A campaign is not considered successful merely because an impression or click occurred. Success must be evaluated against the advertiser's declared objective and available evidence.

Metrics may include:
- impressions
- reach
- clicks
- conversions
- qualified leads
- acquisition cost
- revenue attributed
- return on ad spend
- retention or downstream business outcomes

Attribution must disclose its methodology and limitations.

## Safety and platform integrity

Phantom Promote must not:
- spam users
- impersonate advertisers or platforms
- fabricate performance, customers, reviews or revenue
- manipulate advertising systems
- bypass platform controls
- conceal material sponsorships
- violate applicable advertising/privacy rules

The platform should provide approval gates for sensitive campaigns and maintain auditable campaign history.

## Long-term direction

The system should evolve from an ads manager into a complete advertising operating system while keeping the same Phantom control-plane contract. The underlying delivery channel can change without changing the customer-facing campaign model.
