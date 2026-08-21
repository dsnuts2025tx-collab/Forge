# Free Phone Service — Domain Model

## Core entities
- Customer: identity, eligibility state, device capabilities, audit metadata.
- Entitlement: customer, plan=`basic-free`, state, policy limits, effective timestamps.
- Provider: type=`cellular|satellite`, name, integration state, capabilities.
- ProvisioningJob: entitlement, provider, operation, state, provider reference, retry metadata.
- ConnectivityState: device, active path=`cellular|satellite|unavailable|test`, reason, observed timestamp.
- UsageEvent: entitlement, provider, path, event type, quantity, provider reference, timestamp.
- CostRecord: usage event/provider reference, expected cost, actual cost, currency, reconciliation state.
- FundingSource: source type, committed amount, received amount, allocated amount, expiry/status.
- FundingCoverage: period, forecast cost, committed funding, received funding, coverage ratio, shortfall.
- AuditEvent: actor, action, target, result, timestamp, correlation id.

## State rules
- Entitlements can only become `active` after eligibility and provisioning checks succeed.
- Only provider integrations marked `LIVE` can provision real customer service.
- `TEST_ONLY` providers can exercise software paths but cannot create live connectivity claims.
- Connectivity state must never report `cellular` or `satellite` unless backed by an eligible provider/device path.
- Usage and cost records are append-oriented; reconciliation may add corrections but must not silently rewrite history.
