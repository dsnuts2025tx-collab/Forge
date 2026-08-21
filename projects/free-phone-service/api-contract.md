# Free Phone Service — API Contract

The first runnable control plane should expose these domain operations behind authenticated routes.

## Customer
- `POST /phone/v1/customers` — create customer.
- `GET /phone/v1/customers/:id` — retrieve customer and entitlement state.
- `POST /phone/v1/customers/:id/enroll` — evaluate eligibility and create the basic $0 entitlement.
- `GET /phone/v1/customers/:id/connectivity` — current connectivity state and reason.
- `GET /phone/v1/customers/:id/usage` — usage summary and policy counters.

## Providers
- `GET /phone/v1/providers` — provider/integration status visible to operators.
- `POST /phone/v1/providers/:id/health` — authenticated provider health check.
- `POST /phone/v1/providers/:id/provision` — provisioning job for an eligible entitlement.
- `POST /phone/v1/providers/:id/suspend` — suspend service.
- `POST /phone/v1/providers/:id/resume` — resume service.

## Accounting
- `POST /phone/v1/usage/events` — ingest normalized usage event.
- `GET /phone/v1/accounting/coverage` — funding coverage calculation.
- `GET /phone/v1/accounting/costs` — expected/actual provider costs.

## Operations
- `GET /phone/v1/admin/customers`
- `GET /phone/v1/admin/entitlements`
- `GET /phone/v1/admin/integrations`
- `GET /phone/v1/admin/audit`

## Safety rules
- State-changing routes require authentication and authorization.
- Provider secrets are externalized.
- Provider operations are idempotent by correlation/idempotency key.
- Errors return an explicit unavailable/degraded state rather than fabricated connectivity.
