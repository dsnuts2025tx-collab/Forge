# Provider Adapter Contract

Provider adapters are the boundary between Forge and real connectivity partners.

## Required capabilities
- `health`: authenticated provider health/status check.
- `provision`: create or activate an approved SIM/eSIM/service entitlement.
- `suspend`: suspend service without deleting customer records.
- `resume`: resume an entitled service.
- `usage`: retrieve usage events or provider usage references.
- `cost`: retrieve or calculate provider charges attributable to the service.
- `connectivity`: report current supported connectivity state.

## Adapter lifecycle
`DISCOVERED -> CONFIGURED -> AUTHENTICATED -> TESTED -> LIVE`

Only `LIVE` adapters may be selected for real customer provisioning.

## Required controls
- Secrets must come from the production secret store; never commit credentials.
- Provider responses must be normalized into the Forge domain model.
- Every provisioning/state change produces an audit event.
- Provider failures must fail closed rather than falsely report service.
- Cost records must retain provider references for reconciliation.

## Initial implementations
The first production software release may ship with mock/test adapters for cellular and satellite to validate the control plane. These are explicitly `TEST_ONLY` and cannot activate customer network service.
