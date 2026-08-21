# Forge Production Readiness — LOCKED

Forge Engine 6.0.0-PLATINUM is the production architecture.

## Deployment authority — LOCKED
Forge production deployment is **Cloudflare Workers**, not Vercel. The canonical deployment path is GitHub `main` → Cloudflare Worker (`phantom-forge-engine`) using `wrangler.jsonc`. Vercel is not a required production dependency.

## Customer path
Home → Builder → Build → Project persistence → Billing → Entitlement → Preview/Export → Deployment.

## Live Stripe
The connected Stripe account has been verified in live mode. Forge must use only an authoritative Forge live recurring price through `FORGE_PRICE_ID`.

## Runtime configuration
Required Worker secrets:
- OPENROUTER_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- FORGE_PRICE_ID
- FORGE_SESSION_SECRET
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

## Proof rule
No production-complete claim until a live smoke test demonstrates the customer path end-to-end, including successful build, persistence, billing/webhook entitlement, preview/export/deployment, and cancellation/payment-failure enforcement.

## Operating rule
Build around failures; do not let one provider failure destroy the customer journey. Preserve the existing architecture and lock verified improvements into `main`.
