# Free Phone Service Architecture

## Connectivity plane
1. Device/eSIM identity
2. Connectivity policy engine
3. Cellular provider adapters
4. Satellite provider adapters
5. Wi-Fi/internet fallback where permitted
6. Emergency connectivity policy

## Control plane
- Identity and authentication
- Customer eligibility
- Service entitlements
- Provisioning jobs
- Usage events
- Network health
- Provider contracts/integration state
- Cost ledger
- Funding/revenue ledger
- Audit trail

## Economics
The service must maintain a funding-coverage view:

`available funding + partner subsidies + platform revenue >= expected connectivity/operations cost`

No customer billing is required for the basic tier, but the platform must identify who/what pays the underlying costs.

## Integration rule
Carrier and satellite adapters are interfaces, not fabricated integrations. Production activation requires legitimate provider credentials, agreements, approved device capabilities, and applicable regulatory requirements.
