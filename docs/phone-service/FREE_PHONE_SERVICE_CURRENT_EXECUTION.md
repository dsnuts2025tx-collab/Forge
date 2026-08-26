# Phone Service Completely Free — Current Execution Baseline

Status: ACTIVE / NOT PRODUCTION-LIVE
Date: 2026-08-26

## Objective
Produce a genuinely usable customer-$0 phone service with no Wi-Fi dependency: cellular first, compatible satellite fallback, observable connectivity state, provider-neutral integration, usage/cost accounting, funding coverage, admin controls, acceptance testing, deployment readiness, and rollback.

## Current verified external baseline
- 1NCE Management API v2 is the forward integration target. 1NCE states API v1 retires at the end of 2026; migration must be completed by December 31, 2026.
- 1NCE v2 uses OAuth2 client credentials and exposes SIM status/management, events, quotas, SMS, connectivity reset, and top-up operations.
- 1NCE Data Streamer is the preferred continuous event/usage ingestion path; the Management API is preferred for on-demand queries and control.
- 1NCE usage-event cost fields are explicitly non-authoritative legacy indicators and must not be treated as the real-world bill. Authoritative tariff/account billing reconciliation is required.
- 1NCE reference IDs for SIMs, operators, countries, tariffs, ratezones, and RAT types should be resolved through reference APIs and cached with graceful handling of new IDs.
- Android API 36 provides the public SatelliteManager and satellite state listener APIs on compatible devices exposing the required satellite telephony feature.

## Execution architecture
CELLULAR_CONNECTED -> CELLULAR_DEGRADED -> SATELLITE_ELIGIBLE -> SATELLITE_ACTIVE -> OFFLINE

Wi-Fi is not an acceptance dependency for the production path.

## Production evidence gates
1. Legitimate carrier/provider account and authorization.
2. Dedicated production credentials securely provisioned.
3. Real compatible physical device and SIM/eSIM provisioned.
4. Verified cellular attachment with Wi-Fi disabled.
5. Device and provider connectivity state agree and are timestamped.
6. Usage events are ingested, deduplicated, normalized, and reconciled.
7. Authoritative provider billing/tariff data reconciles to the internal cost ledger.
8. Customer entitlement remains $0 while provider/infrastructure cost is separately funded.
9. Funding coverage is verified before customer production activation.
10. Admin suspension, recovery, abuse controls, and audit trail are tested.
11. Satellite fallback requires legitimate carrier/provider entitlement, compatible hardware, authorization/agreements, and observed end-to-end fallback; device API capability alone is insufficient.
12. Production deployment, telemetry, health checks, rollback, and acceptance evidence are complete.

## Current blockers
- No verified production carrier credentials/account and provisioning evidence in the accessible project record.
- No verified physical device/SIM/eSIM with observed Wi-Fi-disabled cellular attachment in the accessible project record.
- No verified satellite provider/carrier entitlement, agreement, compatible hardware, and observed fallback in the accessible project record.
- No verified production funding coverage in the accessible project record.

## Next execution priority
Build/validate the provider-neutral cellular adapter against the v2 target, implement event/usage normalization and authoritative cost reconciliation, wire funding/admin gates, then execute physical Wi-Fi-disabled acceptance testing. Do not promote simulated or documentation-only results to LIVE.

## Truth-state rule
PLANNED -> BUILT -> TESTED -> VERIFIED -> DEPLOYED -> PRODUCTION. Every production claim requires evidence at the corresponding state.
