# Free Phone Service — MVP Production Specification

## Product acceptance
A deployment is MVP-usable only when the control plane supports customer enrollment, $0 entitlement, connectivity state, usage events, cost/funding coverage, provider integration status, administrative controls, auditability, and automated tests.

## Connectivity acceptance
Wi-Fi is optional and must never be a prerequisite for the core service. The runtime model is cellular-first, then compatible satellite fallback. The application may use Wi-Fi for ordinary internet access, but the phone service itself must not depend on Wi-Fi.

## Provider adapters
Every provider adapter exposes the same lifecycle concepts: discover availability, provision/deprovision, report status, record usage, and surface provider errors. Adapters remain disabled until legitimate credentials, contracts, compatible devices, and regulatory prerequisites are present.

## Customer states
pending -> eligible -> provisioning -> active -> degraded -> suspended -> terminated

## Cost and funding
Every billable usage event maps to a provider/cost category. The funding ledger tracks committed funding, received funding, partner subsidy, platform revenue allocated to connectivity, forecast cost, actual cost, and coverage ratio. The system must flag projected funding shortfalls before service commitments exceed coverage.

## Admin controls
Operators can manage eligibility policies, provider adapters, integration readiness, funding sources, service policies, emergency priority policy, and customer entitlements. All privileged actions are auditable.

## Security
No provider secrets belong in source control. Production credentials are external secrets. Customer records are minimized. Audit events must avoid storing unnecessary sensitive data.

## Test gates
- Core state transitions
- $0 entitlement enforcement
- Cellular-first policy
- Satellite fallback selection when eligible
- Wi-Fi absence does not invalidate service state
- Usage/cost ledger balancing
- Funding coverage alerts
- Provider adapter failure handling
- Admin authorization
- Audit event creation

## Deployment gate
Do not label the system production-ready until automated tests pass and the deployment exposes a working customer experience and operator control plane. Do not represent simulated provider connectivity as live carrier service.
