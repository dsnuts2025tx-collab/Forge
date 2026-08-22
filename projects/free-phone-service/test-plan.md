# Free Phone Service — Test Plan

## Unit tests
- Eligibility and $0 entitlement state transitions.
- Connectivity selection precedence: cellular > satellite > unavailable.
- Wi-Fi is never required by the selection policy.
- Provider adapter lifecycle and failure-closed behavior.
- Usage-to-cost reconciliation.
- Funding coverage ratio and shortfall detection.
- Role-based authorization.

## Integration tests
- Customer enrollment persists entitlement state.
- Provisioning creates an auditable job and provider reference.
- Provider health changes integration readiness.
- Usage events reconcile to cost records.
- Funding updates change coverage status.

## No-Wi-Fi acceptance test
Run the customer/service test device with Wi-Fi disabled. The test must verify that an authorized cellular integration remains the primary path. A satellite-capable test fixture may then force cellular loss and verify deterministic fallback selection. If no legitimate network integration is available, the test must report `UNAVAILABLE` rather than pass by simulation.

## Release gates
1. Unit suite passes.
2. Integration suite passes.
3. Authorization/audit tests pass.
4. No-Wi-Fi acceptance test passes against a legitimate supported path before live service is declared.
5. Deployment smoke test passes.
