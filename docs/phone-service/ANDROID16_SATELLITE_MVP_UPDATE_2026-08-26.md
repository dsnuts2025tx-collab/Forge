# Phone Service Completely Free — Android 16 Satellite MVP Update

Date: 2026-08-26

## Verified platform baseline
Android 16 / API 36 is the current stable target for the satellite device adapter. Public Android APIs include `SatelliteManager`, `SatelliteStateChangeListener`, and NTN signal-strength support on compatible devices exposing `FEATURE_TELEPHONY_SATELLITE`.

## Architecture update
The transport controller remains:

CELLULAR_CONNECTED -> CELLULAR_DEGRADED/UNAVAILABLE -> SATELLITE_ELIGIBLE -> SATELLITE_ACTIVE -> OFFLINE

Wi-Fi is explicitly non-primary and is not accepted as proof of the production no-Wi-Fi requirement.

## Evidence requirements
Record independently:
- Wi-Fi state
- cellular registration/service state
- SIM/eSIM identity and provisioning state
- device satellite feature support
- carrier/provider satellite entitlement
- NTN/satellite state and signal information
- actual transport used
- timestamped connectivity observations
- usage records
- authoritative provider billing/tariff evidence

## Security/compatibility rule
Use public Android SDK APIs only. Do not depend on hidden/non-SDK interfaces for production connectivity because Android documents those interfaces as high-risk for breakage.

## Production gate
Android API availability is platform capability evidence only. It is NOT evidence of actual satellite service. Production promotion still requires legitimate carrier/provider agreement, entitlement, credentials/provisioning where applicable, compatible physical hardware, observed no-Wi-Fi cellular operation, observed satellite fallback where contracted, funding coverage, and end-to-end acceptance evidence.

## Current milestone
The device-side satellite abstraction is now aligned with the current public Android 16 platform surface. The project remains NOT production-live until real provider/device evidence is obtained.
