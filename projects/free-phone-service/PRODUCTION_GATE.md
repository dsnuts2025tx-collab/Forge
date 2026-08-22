# Production Gate

A build is usable only when every applicable gate below passes.

## Customer
- $0 basic entitlement is persisted and enforceable.
- Customer can enroll, authenticate, view service status, and see entitlement state.
- Service status remains understandable when Wi-Fi is unavailable.

## Connectivity
- Cellular is the primary connectivity path.
- Wi-Fi is never a required dependency for the service.
- Satellite fallback is represented through a real provider adapter contract and only enabled for compatible devices/networks.
- Connectivity selection reports the active path and reason.
- Emergency-connectivity policy is explicit.

## Economics
- Usage events are metered.
- Provider cost estimates are recorded.
- Funding/revenue coverage is calculated.
- System can flag when expected cost exceeds available funding.

## Operations
- Admin can manage customers, entitlements, providers, integration state, usage, costs, and funding.
- Audit events are recorded for privileged changes.
- Secrets/credentials are never stored in source control.

## Verification
- Automated build/test pipeline exists.
- Critical customer and connectivity flows have tests.
- Production deployment can be repeated deterministically.
- No fake carrier/satellite activation is represented as live service.

## External dependency gate
Real phone service cannot be declared live until legitimate carrier/satellite agreements, credentials/APIs, compatible device support, provisioning, emergency-service requirements, and applicable regulatory/commercial approvals are satisfied.
