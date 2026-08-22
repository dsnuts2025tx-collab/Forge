# Production Readiness

## Current gate
The project is not called a usable phone service until the software and its legitimate network dependencies pass the gates below.

### Software gates
- [ ] Customer can enroll.
- [ ] $0 service entitlement persists across sessions.
- [ ] Connectivity status is visible.
- [ ] Cellular is the primary connectivity path and does not require Wi-Fi.
- [ ] Satellite fallback is represented through a real provider adapter when available.
- [ ] Provider registry and provisioning workflow are operational.
- [ ] Usage events reconcile to provider-cost records.
- [ ] Funding coverage is visible to operators.
- [ ] Customer and admin access controls are enforced.
- [ ] Audit logs are retained for entitlement, provisioning, and billing/cost events.
- [ ] Automated tests pass.
- [ ] Production deployment and smoke tests pass.

### External dependency gates
- [ ] Legitimate cellular provider agreement/integration.
- [ ] Required provider API credentials.
- [ ] Approved SIM/eSIM provisioning path.
- [ ] Compatible customer device(s).
- [ ] Legitimate satellite provider agreement/integration where satellite fallback is offered.
- [ ] Compatible satellite-capable device/network support.
- [ ] Applicable regulatory and emergency-service requirements satisfied.

## No-Wi-Fi acceptance test
With Wi-Fi disabled:
1. Device registers on supported cellular service.
2. Service entitlement remains active.
3. Connectivity status reports cellular.
4. Core supported phone-service functions operate over cellular.
5. If cellular is unavailable and the device/provider support satellite, the platform selects the satellite path.
6. If neither path is available, the platform reports the outage honestly and does not fabricate connectivity.

## Production truth rule
A provider integration is only marked LIVE after successful authenticated communication with the legitimate provider and a successful end-to-end test. Mock adapters may be used for software testing but must never be presented as live network service.
