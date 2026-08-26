# Phone Service Completely Free — Production MVP Advancement — 2026-08-26

## Meaningful update

Fresh verification of current Android platform documentation confirms API level 36 (Android 16) provides the public satellite telephony surface via `SatelliteManager`, including satellite state monitoring, provisioning, pointing, messaging, and location sharing on devices exposing the satellite telephony feature. The platform also exposes carrier-roaming NTN configuration, including automatic/manual/hybrid connection modes and eligibility behavior tied to out-of-service and no-Wi-Fi conditions.

## Architecture update

The production device adapter SHALL target public Android APIs and SHALL NOT depend on non-SDK/hidden interfaces.

Transport state remains:

CELLULAR_CONNECTED -> CELLULAR_DEGRADED/UNAVAILABLE -> SATELLITE_ELIGIBLE -> SATELLITE_ACTIVE -> OFFLINE

The adapter must independently record:
- Wi-Fi enabled/disabled state
- cellular registration and service state
- cellular transport and operator
- device satellite feature availability
- satellite entitlement/eligibility
- satellite connection state
- NTN signal state when exposed
- observed transport actually carrying traffic
- timestamped evidence

## Production gates

1. Real carrier account and credentials
2. Provisioned compatible physical device plus SIM/eSIM
3. Wi-Fi-disabled cellular attachment proof
4. Real connectivity/status event ingestion
5. Authoritative usage and billing reconciliation
6. $0 customer entitlement enforcement with provider-cost separation
7. Verified funding coverage
8. Admin suspension/recovery controls
9. Compatible satellite hardware
10. Carrier/provider satellite agreement and entitlement
11. Observed no-Wi-Fi satellite fallback test
12. Deployment, monitoring, rollback, and audit evidence

## Hard truth rule

Android platform support, API documentation, mocks, simulations, or emulator behavior are not proof of carrier or satellite service. LIVE status requires legitimate provider integration, credentials/authorization, compatible hardware, observed network behavior, and evidence.

## Current blocker

No production carrier provisioning/credentials, compatible tested physical device/SIM/eSIM, satellite agreement/entitlement/hardware, or verified production funding is present in the available Forge evidence. Therefore the service remains NOT LIVE.

## Next highest-value implementation target

Implement and test the provider-neutral cellular adapter/event-normalization/usage-ledger interfaces against a real authorized provider sandbox or account when credentials become available, while keeping the Android 16 public satellite adapter isolated behind the same transport interface.
