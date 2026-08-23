# Production Implementation Plan

## Current state
The branch now contains a runnable Cloudflare Worker/Durable Object control-plane foundation with persistent customer records, $0 entitlements, connectivity policy, provider truth gates, usage/cost accounting, funding coverage, admin/audit controls, enrollment protections, automated tests, and a deployment dry-run workflow.

## Build order
1. Harden customer identity, sessions, authorization, and secrets boundaries.
2. Complete customer portal and operator/admin portal flows against the existing control plane.
3. Formalize the provider adapter contract and onboarding/verification evidence required before any provider can become `LIVE`.
4. Implement legitimate cellular provider adapters and eSIM/SIM provisioning once authorized provider APIs/credentials are available.
5. Implement compatible satellite fallback adapters and device capability checks once an authorized provider/device path is available.
6. Complete usage, provider-cost, funding coverage, reconciliation, and policy-limit enforcement end to end.
7. Add automated unit/integration/end-to-end tests, including Wi-Fi-disabled acceptance tests against controlled provider adapters.
8. Add reproducible deployment configuration, smoke tests, health diagnostics, and rollback verification.
9. Run production acceptance with an authorized cellular provider and compatible device; Wi-Fi must be disabled for the cellular acceptance test.
10. Only after legitimate carrier/satellite credentials, contracts, approved devices, and required approvals are available, enable corresponding live provider adapters.

## Release gate
The MVP is not "usable" until a deployed build passes the customer lifecycle, entitlement persistence, Wi-Fi-disabled cellular path, fallback capability checks, accounting/reconciliation, access control, auditability, automated test suite, deployment smoke test, and operational checks.

## Non-negotiable truth constraint
A simulated or mock network adapter may prove the software architecture but must never be presented to customers as live cellular or satellite service.
