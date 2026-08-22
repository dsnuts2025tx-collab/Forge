# Production MVP Acceptance Specification

## Release gate
The MVP is not considered usable until the deployed application supports the following end-to-end flows without requiring Wi-Fi for the phone-service path.

### Customer
- Create/sign in to an account.
- Establish a $0 basic service entitlement.
- View service state and current connectivity mode.
- See whether cellular, satellite fallback, or unavailable is active.
- View usage and service-policy information.
- See clear notices when real network activation is pending provider integration.

### Connectivity
- Cellular is the preferred network path.
- Satellite is a fallback only when supported by the device/network and legitimately integrated.
- Wi-Fi is optional and never required for the core phone-service acceptance test.
- Connectivity selection must fail safely rather than claiming service when no eligible network is available.
- Emergency connectivity is treated as highest priority where supported.

### Provider adapters
- Standard interface for provider availability, activation/provisioning, usage, and health.
- Standard interface for satellite fallback capability and status.
- Adapter state distinguishes simulated/test integration from verified production integration.
- No fabricated carrier or satellite credentials, coverage, activation, or billing data.

### Economics
- Meter usage events.
- Attribute expected cost by provider/network mode.
- Track funding/revenue sources.
- Calculate funding coverage for active entitlements.
- Prevent silent expansion of $0 service beyond funded policy limits.

### Operations
- Admin dashboard for customers, entitlements, provider integrations, network health, usage, costs, funding, and audit events.
- Role-based administrative access.
- Immutable audit trail for provisioning and policy changes.
- Health checks and deployment diagnostics.

### Security and reliability
- Secure authentication/session handling.
- Secrets never committed to source control.
- Input validation and authorization on all state-changing operations.
- Error states must be explicit and recoverable.
- Basic automated tests for entitlement, connectivity selection, cost accounting, funding coverage, and authorization.

## External dependency gate
Actual customer cellular or satellite service cannot be declared production-active until the relevant carrier/satellite provider has supplied legitimate commercial authorization, technical credentials/APIs, compatible device support, and any required regulatory/service approvals.

## Definition of done
A deployed MVP passes the customer and operator flows, passes automated tests, reports its integration state honestly, and can be exercised with a compatible non-Wi-Fi cellular test path. Satellite fallback remains an integration capability until an actual supported provider/device path is connected.
