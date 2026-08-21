# Production MVP Contract

## Required product behavior
- Customer can enroll in a $0 basic-service entitlement.
- Customer can view entitlement and connectivity state.
- Wi-Fi is never required for the core connectivity path.
- Cellular is preferred when an authorized cellular provider is available.
- Compatible satellite is selected only through an authorized provider/device integration.
- Provider adapters expose a common health, provisioning, connectivity, and usage contract.
- Usage events feed a persistent cost ledger.
- Funding sources and expected costs feed a coverage calculation.
- Operators can inspect customers, providers, integrations, usage, costs, funding, incidents, and audit events.
- Emergency connectivity is represented as a higher-priority policy path.
- Unsupported capabilities must be shown as unavailable rather than simulated as live service.

## Verification gates
1. Enrollment persistence test.
2. Entitlement enforcement test.
3. Wi-Fi-disabled cellular-path test using a real authorized cellular integration when available.
4. Satellite fallback policy test with a compatible integration or deterministic adapter test fixture.
5. Provider adapter contract tests.
6. Usage-to-cost ledger reconciliation test.
7. Funding coverage calculation test.
8. Role/access-control test.
9. Audit-log integrity test.
10. Deployment smoke test.

## Production truth gate
The MVP may be deployed as a control plane before live carrier/satellite integrations exist, but it may not represent simulated provider connectivity as real connectivity. Live customer phone service requires legitimate carrier/satellite agreements, credentials, supported devices, provisioning, and applicable regulatory/operational approvals.
