# Production Status

## Current milestone
Production architecture and acceptance requirements are defined. The repository currently contains the project foundation and architecture documents; the runnable customer/control-plane implementation has not yet been established in this branch.

## Required build gates
- Customer enrollment and authentication
- Persisted $0 service entitlement
- Cellular-first operation with Wi-Fi disabled
- Satellite fallback adapter for compatible networks/devices
- Provider registry and provisioning interfaces
- Connectivity health/status
- Usage and provider-cost ledger
- Funding coverage ledger
- Customer portal
- Operator/admin portal
- Audit logging and access control
- Automated tests
- Repeatable deployment
- End-to-end smoke test

## External dependency gate
Live cellular or satellite service must not be represented as operational until the relevant provider agreements, credentials, provisioning capabilities, compatible devices, and regulatory/commercial requirements are actually available.

## Definition of usable
A release is usable only when the software passes the internal gates above and a real supported connectivity path works with Wi-Fi disabled. The platform may be deployed before live provider integration, but that release must clearly identify provider integration as pending rather than presenting simulation as service.
