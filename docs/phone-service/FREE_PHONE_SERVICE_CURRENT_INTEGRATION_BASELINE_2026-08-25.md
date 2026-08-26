# Free Phone Service — Current Integration Baseline

Date: 2026-08-25
Status: ADVANCING / NOT PRODUCTION LIVE

## Verified cellular integration target
1NCE API v2 is retained as a concrete provider adapter target. Current documentation exposes OAuth2 authentication and SIM management, including SIM detail/status, connectivity reset, events, data/SMS quotas, SMS operations, and top-up operations. 1NCE states API v1 retires at the end of 2026; v2 migration must be completed before that retirement.

## Event and usage architecture
Use a provider-neutral event schema. Normalize at minimum:
- event_id
- timestamp
- ICCID / subscriber identity
- IMEI / device identity
- operator/network identity
- country / MCC / MNC where available
- radio/access technology where available
- connectivity state
- data RX/TX/total
- SMS MO/MT/count
- tariff/rate-zone identifiers
- provider reference IDs
- alert/severity

Provider-reported legacy `cost` fields are NOT authoritative billing. The 1NCE usage documentation explicitly says these fields represent a 1:1 translation of usage rather than real-world cost. Authoritative provider billing/tariff/account data must be reconciled separately.

## Production gates
No production promotion unless all are evidenced:
1. Authorized provider account and credentials.
2. Provisioned compatible physical SIM/eSIM and device.
3. Wi-Fi-disabled cellular attachment observed on the target hardware.
4. Real connectivity status observed through device/provider signals.
5. Usage events ingested and reconciled.
6. Authoritative provider charges/tariffs reconciled.
7. Customer entitlement remains $0 while provider cost is separately funded.
8. Funding coverage is verified before service activation.
9. Admin suspension, recovery, quota, and abuse controls tested.
10. Compatible satellite fallback is legitimately provisioned and tested, where supported.
11. Deployment, telemetry, rollback, audit, and incident controls pass acceptance tests.
12. Evidence ledger records the test environment, hardware, provider, credentials provenance, timestamps, results, and responsible approval.

## Current blockers
- No verified production carrier account/credentials are present in the available project evidence.
- No verified provisioned physical SIM/eSIM plus compatible target phone with Wi-Fi-disabled attachment evidence is present.
- No verified satellite provider/device entitlement, agreement, credentials, and real-world fallback test is present.
- No verified production funding source is present.

## Non-claim rule
Architecture, API documentation, mocked responses, simulated connectivity, or platform API availability cannot be promoted to LIVE connectivity evidence.

## Next execution priority
Implement and test the provider-neutral cellular adapter, event/usage normalization, authoritative cost reconciliation interface, funding-coverage gate, admin controls, and evidence ledger so that once legitimate provider/device access is obtained, the remaining path is configuration + physical acceptance testing rather than architectural redesign.
