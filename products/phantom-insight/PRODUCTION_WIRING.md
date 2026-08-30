# Phantom Insight — Production Wiring Contract

Status: LOCKED BUILD CONTRACT / IMPLEMENTATION IN PROGRESS

## Objective
Turn the existing Phantom Insight launch core into a real Internet-accessible product without replacing verified work. Use the existing Phantom/Forge control architecture and preserve provider boundaries.

## Credentials
Existing authorized credentials are reused through the appropriate secret stores. **No secrets, API keys, webhook signing secrets, session secrets, database credentials, or payment credentials may be committed to Git.** The application consumes secret references at runtime.

## Production authority
- Source/configuration: Phantom-controlled Git repository
- Production execution/deployment: Phantom-controlled infrastructure and approved deployment path
- GitHub is source/configuration authority, not runtime authority.
- Vercel is not a foundational Phantom production dependency.
- External services sit behind the Phantom External Boundary Layer.

## Required runtime configuration

### PHIA / AI
- `OPENAI_API_KEY` or the already-authorized Phantom AI provider credential
- `PHIA_MODEL`
- `PHIA_SYSTEM_PROMPT_VERSION`
- `PHIA_MAX_OUTPUT_TOKENS`
- `PHIA_TIMEOUT_MS`
- `PHIA_RATE_LIMIT`

### Identity / sessions
- `PHANTOM_SESSION_SECRET`
- `AUTH_ISSUER`
- `AUTH_AUDIENCE`
- `AUTH_COOKIE_DOMAIN`
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAMESITE=lax`

### Persistence
- `DATABASE_URL` or Phantom-approved database binding
- `DATABASE_ENCRYPTION_KEY` where applicable
- `DATA_REGION`
- `MIGRATION_LOCK`

### Stripe / entitlements
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY` only where client-side Stripe requires it
- `STRIPE_PRICE_PLUS`
- `STRIPE_PRICE_GOLD`
- `STRIPE_PRICE_PLATINUM`

Canonical written prices: Free $0, Plus $19/month, Gold $29/month, Phantom Platinum $49/month.

### Observability
- `PHANTOM_ENVIRONMENT`
- `RELEASE_ID`
- `LOG_LEVEL`
- `TRACE_SAMPLING_RATE`
- `HEALTHCHECK_TOKEN`

## PHIA request pipeline

1. Authenticate request.
2. Resolve user identity and account status.
3. Resolve server-side entitlement.
4. Apply safety/privacy/data-scope policy.
5. Classify intent and select realm.
6. Select specialist(s) when useful.
7. Retrieve only authorized persistent context.
8. Build a versioned PHIA orchestration request.
9. Call the authorized AI provider through the external boundary.
10. Validate response policy/schema.
11. Persist conversation/event metadata and user-visible content according to retention rules.
12. Return response with trace/release metadata that does not expose secrets.
13. Emit audit/observability events.

## Persistent user data

Minimum durable entities:

- users
- sessions
- profiles
- conversations
- messages
- journal_entries
- dream_entries
- saved_items
- symbols
- learning_paths
- learning_progress
- achievements
- community_profiles
- community_groups
- community_discussions
- workshops_events
- subscriptions
- entitlements
- webhook_events
- audit_events

Every user-owned record must carry an unambiguous owner/account boundary. Reads and writes must enforce that boundary server-side.

## Billing / entitlement pipeline

Checkout → Stripe subscription → signed webhook → idempotent event record → subscription reconciliation → server-side entitlement update → audit event → feature authorization.

The browser must never be the authority for paid access.

Required lifecycle handling:
- checkout completion
- active subscription
- renewal
- cancellation at period end
- immediate cancellation where applicable
- payment failure
- incomplete/unpaid states
- refund/credit events where applicable
- plan change
- webhook replay/idempotency

Entitlements must fail closed for protected capabilities when authoritative billing state cannot be established.

## Data/security controls

- TLS in transit.
- Encryption at rest through approved infrastructure.
- Least-privilege service credentials.
- Secret values never logged.
- Request/user identifiers minimized in logs.
- Server-side authorization on every protected resource.
- Webhook signature verification.
- Idempotency for billing and persistence mutations.
- Rate limiting and abuse controls.
- Input validation and output validation.
- Audit trail for consequential account, entitlement, administrative, and data operations.
- Export/delete flows must honor applicable product policy and retention requirements.

## Reliability

Provider failure must degrade gracefully. PHIA should not turn an upstream failure into loss of user data or corrupted entitlement state.

Critical mutations require durable ordering or transactional protection appropriate to the backing store.

Health checks must distinguish:
- process alive
- database reachable
- AI provider reachable
- Stripe integration configured
- webhook processing healthy
- entitlement reconciliation healthy

## Verification gates

A feature may be marked implemented when source exists.

It may be marked tested only after execution evidence.

It may be marked deployed only after production deployment evidence.

It may be marked live only after public reachability evidence.

Phantom Insight may be marked **production-verified** only after an end-to-end smoke test demonstrates:

Public access → account creation/login → PHIA interaction → persistence → entitlement check → checkout/subscription where applicable → webhook reconciliation → paid capability authorization → return journey → cancellation/payment-failure enforcement → monitoring/audit evidence.

## No false completion

Current credentials may be reused, but the existence of credentials does not itself prove that a production integration is working. Runtime configuration, successful requests, webhook delivery, persistence, authorization, deployment, and live customer-path evidence must still be demonstrated.

## Continuous improvement

After each verified release, inspect failures, latency, cost, security findings, user friction, AI quality, and reliability. Correct adjacent issues rather than leaving known production blockers orphaned.

**LOCKED.**
