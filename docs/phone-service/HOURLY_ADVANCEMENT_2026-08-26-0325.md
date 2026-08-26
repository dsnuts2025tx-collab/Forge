# Phone Service Completely Free — Advancement Record

Date: 2026-08-26

## Meaningful advancement

Fresh platform verification confirms Android API 36 exposes `SatelliteManager` for satellite state monitoring, provisioning, pointing, messaging, and location sharing on devices declaring telephony satellite support. Android's current CarrierConfig documentation also exposes carrier-roaming NTN connection modes and explicitly models satellite eligibility around conditions including out-of-service and no Wi-Fi. These are platform primitives only; they do not constitute service entitlement or connectivity.

## Engineering consequence

The MVP device adapter must expose a provider-neutral transport state:

`CELLULAR_CONNECTED -> CELLULAR_DEGRADED -> SATELLITE_ELIGIBLE -> SATELLITE_ACTIVE -> OFFLINE`

The adapter must independently record:
- device capability
- carrier entitlement
- satellite provider entitlement
- Wi-Fi state
- cellular registration state
- NTN eligibility/state
- observed transport
- timestamped evidence

No state may be promoted to LIVE solely from API availability, simulated events, documentation, or device capability flags.

## Production gates

1. Real carrier account/credentials and provisioning.
2. Compatible physical device and SIM/eSIM.
3. Wi-Fi-disabled cellular attachment observed on the device.
4. Real connectivity/status events ingested and reconciled.
5. Usage reconciled against authoritative provider billing/tariff data.
6. Customer entitlement remains $0 while underlying provider cost has verified funding coverage.
7. Admin suspension/recovery and audit controls pass testing.
8. Satellite carrier/provider agreement and entitlement.
9. Compatible satellite-capable hardware with observed fallback behavior.
10. Deployment, monitoring, rollback, and evidence ledger pass production acceptance.

## Current status

NOT PRODUCTION-LIVE. No carrier or satellite connectivity is claimed. Real-world credentials, provisioning, compatible hardware, agreements, and observed connectivity evidence remain required before promotion.

## Sources

Android Developers — SatelliteManager API reference, updated August 3, 2026.
Android Developers — CarrierConfigManager API reference, current August 2026.
