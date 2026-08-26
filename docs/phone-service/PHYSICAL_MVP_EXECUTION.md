# Phone Service Completely Free — Physical MVP Execution Gate

Status: ACTIVE EXECUTION

## Objective
Move from architecture-only readiness to a genuinely usable production MVP without Wi-Fi dependency.

## Transport contract
CELLULAR_CONNECTED -> CELLULAR_DEGRADED -> SATELLITE_ELIGIBLE -> SATELLITE_ACTIVE -> OFFLINE

Wi-Fi is not an accepted primary transport for the MVP acceptance test.

## Cellular execution
1. Provider-neutral adapter remains the core boundary.
2. First concrete provider target: 1NCE Management API v2.
3. Credentials must be supplied through production secret management; never committed.
4. Provision a real SIM/eSIM on a compatible physical device.
5. Observe registration and data service with Wi-Fi disabled.
6. Ingest provider events/usage into the normalized ledger.
7. Reconcile provider billing against authoritative account/tariff data.

## Customer economics
- Customer entitlement price: $0.
- Provider/network costs: separately accounted.
- Funding coverage must be verified before production activation.
- Funding controls must fail closed when coverage is insufficient.

## Satellite execution
Android API 36 public satellite APIs are the device-side baseline where the device exposes FEATURE_TELEPHONY_SATELLITE. Capability, modem-enabled state, entitlement, carrier agreement, and actual network attachment are distinct evidence states.

Satellite must not be reported as active from API capability alone. Carrier/provider agreement and compatible hardware are mandatory before activation testing.

## Acceptance evidence
A production claim requires all of:
- real carrier/provider credentials
- real provisioned SIM/eSIM
- compatible physical device
- Wi-Fi disabled during cellular test
- observed cellular registration/data
- timestamped device and provider evidence
- usage event ingestion
- authoritative cost reconciliation
- verified funding coverage
- admin suspend/recover test
- satellite authorization/hardware evidence if fallback is enabled
- observed satellite fallback if fallback is enabled
- deployment health checks and rollback path

## Security and truth-state rules
- No credentials in source control.
- No mocks, simulations, documentation, or capability flags may be promoted as production connectivity evidence.
- Public Android SDK APIs only; no non-SDK telephony dependency.
- Any failed acceptance gate keeps the service out of LIVE state.

## Current state
Software control-plane foundation is advanced. Real connectivity remains unproven until the external carrier/provider, physical device, credentials, agreements, and funding prerequisites are present and tested.
