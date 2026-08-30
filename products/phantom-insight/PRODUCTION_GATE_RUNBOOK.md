# Phantom Insight Production Gate Runbook

Status: EXECUTION PLAN / EVIDENCE REQUIRED

## Release rule

Implemented != Tested != Deployed != Production-Verified.

No gate is marked production-verified until an observable production result is captured.

## Gate 1 — PHIA production call

- Deploy the PHIA adapter behind the existing server-side runtime boundary.
- Load the authorized AI provider secret only as a runtime secret.
- Send a real authenticated Insight request.
- Record request/release IDs, provider result, latency, error status, and audit event.
- Confirm provider credentials never reach client responses or logs.

## Gate 2 — Persistent data

- Apply the production schema/migration for Insight accounts, sessions, messages, journals, learning/progress, entitlements, webhook idempotency, and audit records.
- Create a real test account.
- Write conversation/journal data.
- Redeploy/restart the Worker.
- Read the same data back.
- Confirm account isolation.

## Gate 3 — Authentication

- Create a real test account.
- Authenticate.
- Establish a secure server session.
- Call an authenticated Insight endpoint.
- Confirm unauthenticated and cross-account requests fail closed.
- Revoke/logout and confirm the session no longer authorizes access.

## Gate 4 — Stripe

- Use the canonical Insight membership configuration.
- Complete a real permitted checkout flow using the appropriate Stripe environment.
- Configure the production webhook endpoint.
- Verify Stripe's webhook signature using the official signing algorithm.
- Persist event IDs and reject duplicate processing.
- Exercise subscription lifecycle events.

## Gate 5 — Entitlements

- Derive tier only from server-authoritative billing state.
- Verify Free/Plus/Gold/Platinum feature boundaries.
- Confirm payment state changes update the account entitlement.
- Confirm cancellation/payment failure removes or changes access according to policy.
- Confirm client-supplied tier values cannot grant access.

## Gate 6 — Production deployment

- Merge only after CI gates pass.
- Deploy through the Phantom-controlled Wrangler/Worker path.
- Verify production bindings and runtime secrets exist without exposing values.
- Run `/health` and production status checks.
- Record deployment/release identifier.

## Gate 7 — Live end-to-end smoke test

Public site -> sign up -> authenticate -> PHIA request -> real response -> persistence -> reload/re-authenticate -> checkout -> verified webhook -> entitlement change -> protected capability -> logout/login -> persistent data -> cancellation/failure path -> audit/observability.

## Evidence ledger

For each gate capture:

- release/commit SHA
- timestamp
- endpoint or workflow
- test account identifier (non-secret)
- request/event ID
- expected result
- observed result
- logs/CI/deployment reference
- pass/fail

A gate remains open if evidence is missing.
