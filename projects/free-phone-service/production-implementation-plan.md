# Production Implementation Plan

## Current state
The production foundation and acceptance contract are in place. The branch is still a draft PR and does not yet contain a runnable customer/control-plane application.

## Build order
1. Create a runnable service shell with persistent storage.
2. Implement customer identity, enrollment, eligibility, and persistent $0 entitlement.
3. Implement connectivity state model and Wi-Fi-independent cellular-first policy.
4. Implement provider adapter interfaces, provisioning jobs, and provider registry.
5. Implement compatible satellite fallback adapter boundary and device capability checks.
6. Implement usage events, provider-cost ledger, funding coverage, and reconciliation.
7. Implement customer portal and operator/admin portal.
8. Add authentication, authorization, audit logging, secrets boundaries, rate limiting, and failure recovery.
9. Add automated unit/integration/end-to-end tests, including Wi-Fi-disabled acceptance tests against controlled provider adapters.
10. Add reproducible deployment configuration and production smoke tests.
11. Only after legitimate carrier/satellite credentials, contracts, approved devices, and required approvals are available, enable live provider adapters.

## Release gate
The MVP is not "usable" until a deployed build passes the customer lifecycle, entitlement persistence, Wi-Fi-disabled cellular path, fallback capability checks, accounting/reconciliation, access control, auditability, automated test suite, deployment smoke test, and operational checks.

## Non-negotiable truth constraint
A simulated or mock network adapter may prove the software architecture but must never be presented to customers as live cellular or satellite service.
