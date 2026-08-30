# Phantom Insight — Entitlement Contract

**Status: LOCKED**

## Canonical plans

| Plan | Monthly price | Authority |
|---|---:|---|
| Free | $0 | Product Canon |
| Plus | $19 | Product Canon |
| Gold | $29 | Product Canon |
| Phantom Platinum | $49 | Product Canon |

## Authority rule

The browser is never the authority for paid access. The server resolves entitlement from the authoritative subscription state.

## State machine

`unknown → active → past_due/unpaid → canceled/expired`

`unknown` must fail closed for protected paid capabilities.

## Stripe event processing

1. Verify webhook signature.
2. Derive event id.
3. Reject/replay safely when event id already processed.
4. Persist webhook receipt before applying mutation where transactionally appropriate.
5. Reconcile customer/subscription/price identifiers.
6. Update subscription state.
7. Recompute entitlement.
8. Emit audit event.
9. Acknowledge only after durable processing succeeds.

## Required lifecycle coverage

- checkout/session completion
- subscription created
- subscription updated
- subscription canceled
- invoice paid
- invoice payment failed
- subscription past due/unpaid
- plan changes
- refunds/credits where applicable
- webhook retries/replays

## Security

- Stripe signing secret is runtime-only.
- Never trust client-provided tier names or prices.
- Never grant paid features solely from a redirect/query parameter.
- Price IDs are configuration, not user input.
- Entitlement changes are auditable.

## Verification

A paid capability is production-verified only after a real test demonstrates: checkout → webhook → durable subscription state → entitlement grant → protected feature access.

A cancellation/payment-failure test must demonstrate removal or restriction of protected access according to the canonical policy.

**LOCKED.**
