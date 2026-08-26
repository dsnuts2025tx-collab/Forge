# Phone Service Completely Free — Production MVP Control Plane

## Implemented

- Provider-neutral cellular adapter interface.
- Satellite adapter interface separated from cellular service authorization.
- Connectivity state derivation with cellular-first behavior and satellite fallback.
- Usage-event ledger with event-ID reconciliation against authoritative billing data.
- Customer entitlement fixed at `$0` in the core model; provider cost remains separate.
- Funding position and projected-cost controls.
- Fail-closed production readiness gate.
- Satellite fallback cannot be claimed without both agreement/authorization evidence and observed fallback evidence.

## Production proof order

1. Obtain legitimate cellular provider account and production credentials.
2. Provision a compatible physical SIM/eSIM and device.
3. Verify cellular attachment with Wi-Fi disabled.
4. Ingest real provider events and reconcile them against authoritative billing.
5. Verify funding coverage for the underlying provider cost while keeping customer entitlement at $0.
6. Exercise admin suspension/recovery and cost ceilings.
7. Separately verify satellite entitlement/agreement, compatible hardware, and observed fallback.
8. Run deployment, telemetry, rollback, and acceptance tests.

## Non-claims

Documentation, mocks, simulated events, Android API capability, or an adapter interface do not constitute live carrier or satellite connectivity. Production status remains blocked until the corresponding external evidence exists.

## Architecture boundary

The core service owns entitlement, policy, normalized state, usage accounting, funding controls, evidence, and promotion gates. Carrier and satellite systems are external boundary integrations and must be injected through the adapter interfaces; credentials must never be committed to source.
