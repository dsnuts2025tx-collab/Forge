# Phantom Resource Binding Standard (PRBS) v1.0

Status: LOCKED FOUNDATION / REUSABLE BY ALL FUTURE BUILDS

## Purpose

Provide one predictable Phantom-controlled contract for connecting software capabilities to runtime resources without embedding provider-specific assumptions into product code.

## Canonical binding

Every external or infrastructure dependency MUST have a binding with:

- `binding_id`
- `capability`
- `resource_type`
- `owner`
- `purpose`
- `interface`
- `environment`
- `credential_ref`
- `permissions`
- `dependencies`
- `health_check`
- `timeout_policy`
- `retry_policy`
- `failure_mode`
- `fallback`
- `audit_policy`
- `rotation_policy`
- `data_classification`
- `verification_state`
- `release_id`

## Lifecycle

`DECLARED -> CONFIGURED -> CONNECTED -> TESTED -> DEPLOYED -> HEALTHY -> PRODUCTION-VERIFIED`

A later state MUST NOT be inferred from an earlier state.

## Secret rule

Bindings contain references to secrets, never secret values.

Credential material belongs in the approved runtime secret/configuration system. Source control may contain variable names, schemas, validation rules, and non-secret identifiers only.

## Ownership rule

Product code asks Phantom to resolve a capability binding. Product code MUST NOT scatter provider URLs, credentials, account identifiers, or deployment-specific configuration throughout the application.

## Environment rule

Development, staging, and production bindings are distinct. Production credentials MUST NEVER be silently substituted into development or test environments.

## Security rule

Bindings use least privilege. Read/write/admin permissions are explicitly declared. Cross-account access is denied unless explicitly authorized.

## Health rule

Every binding exposes a deterministic health/readiness check appropriate to its resource. Health checks MUST NOT leak secrets or sensitive customer data.

## Failure rule

Every binding declares timeout, retry, and failure behavior. Customer-impacting failures fail closed where authorization, payment, privacy, or security is involved.

## Evidence rule

Every meaningful binding transition creates evidence: release ID, timestamp, check performed, expected result, observed result, and pass/fail state.

## Drift rule

Runtime configuration is compared with the declared binding. Drift is surfaced for correction and MUST NOT be silently accepted for security-sensitive resources.

## Rotation rule

Credentials are rotatable without changing product code. Rotation must support overlap where the provider permits it and must include post-rotation health verification.

## External boundary rule

Third-party vendors are replaceable dependencies behind Phantom-controlled interfaces. They must not become foundational product primitives unless explicitly approved as such.

## Phantom Insight initial bindings

- PHIA AI provider
- Insight persistent state/database
- authentication/session service
- Stripe billing
- entitlement authority
- Worker runtime
- domain/DNS
- CI/CD
- observability/audit
- notifications/email

## Standard implementation pattern

`Capability -> Binding Resolver -> Resource Adapter -> Health Check -> Evidence -> Runtime`

## Release gate

A build is not production-ready merely because all bindings are declared or configured. Required bindings must reach `PRODUCTION-VERIFIED` through the applicable tests and live customer-path evidence.

## Permanent operating principle

**Make resources predictable. Make connections explicit. Keep secrets outside source. Make failure visible. Make verification evidence-based. Make providers replaceable.**
