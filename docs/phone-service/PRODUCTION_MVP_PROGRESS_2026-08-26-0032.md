# Phone Service Completely Free — Production MVP Progress

Date: 2026-08-26

## Meaningful advancement

### Satellite device integration target refreshed
The Android API 36+ platform now exposes `SatelliteManager` for satellite state monitoring, provisioning, pointing, messaging, and location sharing. Carrier configuration also exposes NTN/satellite eligibility and supported services. These APIs are now the device-side integration target for supported Android hardware.

### No-Wi-Fi fallback semantics strengthened
The runtime state model is explicitly:

`CELLULAR_CONNECTED -> CELLULAR_DEGRADED/UNAVAILABLE -> SATELLITE_ELIGIBLE -> SATELLITE_ACTIVE -> OFFLINE`

Wi-Fi is not an acceptance dependency. Satellite eligibility must be based on actual device/carrier conditions; Android documents eligibility conditions including being out of cellular service and not connected to Wi-Fi for the relevant carrier-roaming NTN path.

### Entitlement and authorization gate
Satellite APIs do not equal satellite service. Carrier entitlement, supported device hardware, carrier/satellite configuration, provider agreements, and legitimate provisioning remain mandatory before activation.

### Production evidence rule
No simulated API response, emulator result, documentation-only capability, or mocked provider may promote the service to LIVE.

## Current production blockers
1. Real cellular provider account/credentials and provisioning.
2. Compatible physical device plus SIM/eSIM.
3. Observed cellular attachment with Wi-Fi disabled.
4. Authoritative usage and billing/tariff reconciliation.
5. Verified funding coverage for provider costs while customer entitlement remains $0.
6. Real satellite/carrier entitlement, compatible hardware, agreement, and observed fallback test.
7. Production deployment, monitoring, rollback, and acceptance evidence.

## Acceptance milestone
The next meaningful milestone is a physical-device test proving cellular service while Wi-Fi is disabled, followed by verified usage/cost reconciliation. Satellite remains a separately gated fallback path.

## Source evidence
- Android SatelliteManager API reference, updated 2026-08-03: https://developer.android.com/reference/android/telephony/satellite/SatelliteManager
- Android CarrierConfigManager satellite/NTN configuration reference, updated August 2026: https://developer.android.com/reference/android/telephony/CarrierConfigManager
