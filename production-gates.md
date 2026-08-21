# Forge Production Gates — LOCKED

Forge Engine 6.0.0-PLATINUM remains the locked production architecture.

## Priority: P0 — AI BUILD
- Builder → `/api` request path hardened.
- OpenRouter response is validated as JSON before Forge reports success.
- Provider failures are surfaced as explicit Forge errors instead of being presented as successful builds.
- `/api/status` now reports `aiConfigured` so production readiness is observable.

## Foundation built
- Forge Power home screen restored.
- Cloudflare deployment job exists on main.
- Provider secrets are server-side; no browser API-key persistence.
- Stripe checkout foundation exists.
- Signed Forge session tokens exist.
- Stripe webhook signature verification foundation exists.
- Durable Object entitlement storage exists.
- Server-side entitlement lookup exists.
- Billing page exists.
- Builder shows production access state.
- Projects screen reads persistent state.

## Required production configuration
- OPENROUTER_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- FORGE_PRICE_ID (authoritative Forge price only)
- FORGE_SESSION_SECRET
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

## Proof standard
Do not mark production proven until a real environment demonstrates: home load; checkout; successful Stripe payment; signed webhook entitlement update; signed customer session; server-side entitlement enforcement; AI build; persistent project across a fresh session; working preview/export/deployment; and correct cancellation/payment-failure access changes.

**Status: P0 build path hardened and locked. Live proof remains gated on production configuration and a successful end-to-end deployment/build run.**
