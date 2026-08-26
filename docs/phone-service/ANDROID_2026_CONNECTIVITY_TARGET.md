# Phone Service — 2026 Android Connectivity Target

Status: engineering target; not production connectivity proof.

## Current platform findings
- Android `android.telephony.satellite` is available from API level 36 and exposes satellite state monitoring plus provisioning, pointing, messaging, and location-sharing operations on devices with the required satellite telephony feature.
- Android provides non-terrestrial-network awareness and carrier-roaming NTN callbacks for supported devices/subscriptions.
- Satellite eligibility can depend on carrier configuration, entitlement, device state, Wi-Fi state, and provider/carrier agreements.
- Android 17 documentation includes optimizations for constrained satellite networks.
- ConnectivityManager remains the system-level network state/failover observation surface.

## Architecture consequence
1. Cellular remains the primary transport.
2. Wi-Fi is not a required transport for the production acceptance path.
3. Satellite is a governed fallback transport only where the device, subscription, carrier/provider, entitlement, and agreement actually support it.
4. The service must expose transport state explicitly: CELLULAR, SATELLITE, WIFI_NON_PRIMARY, OFFLINE, UNKNOWN.
5. The app must distinguish "device/platform supports satellite" from "customer is entitled/provisioned" and from "currently connected to satellite".
6. No satellite feature is promoted to LIVE from API availability alone.

## Production evidence gates
- Compatible physical device with required telephony/satellite feature.
- Legitimate carrier/provider subscription and credentials.
- Required carrier/provider agreement and entitlement.
- Wi-Fi-disabled cellular attachment test.
- Verified transport-state telemetry.
- Verified message/data behavior for the exact supported service class.
- Usage and authoritative cost reconciliation.
- Funding coverage for provider charges.
- Deployment, monitoring, rollback, and audit evidence.

## Current blocker
Repository evidence does not establish a legitimate production carrier/satellite account, credentials, provisioned compatible hardware, provider agreement, or successful real-world attachment. Therefore this document is an implementation target and evidence contract, not a claim of live connectivity.
