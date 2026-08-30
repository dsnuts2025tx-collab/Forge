# Phantom Insight — Production Verification Matrix

**Status: LOCKED / NOT YET CLAIMED VERIFIED**

| Gate | Evidence required | Current status |
|---|---|---|
| Public site | Live HTTPS URL responds | Not yet verified |
| Authentication | Signup/login/logout/session revocation | Not yet verified |
| PHIA | Real provider request + safe response | Not yet verified |
| Persistence | Create/read conversation and journal as same account | Not yet verified |
| Isolation | Account A cannot read Account B data | Not yet verified |
| Entitlement | Server resolves current tier | Not yet verified |
| Checkout | Real Stripe checkout succeeds | Not yet verified |
| Webhook | Signature verified + event durably processed | Not yet verified |
| Paid access | Active subscription grants protected capability | Not yet verified |
| Failure handling | Payment failure/cancellation restricts access | Not yet verified |
| Council | Specialist routing and response policy | Not yet verified |
| Security | Dependency, secret, auth, input/output checks | Not yet verified |
| Accessibility | Critical flows pass accessibility checks | Not yet verified |
| Reliability | Health checks, timeouts, retries, graceful degradation | Not yet verified |
| Observability | Errors, latency, audit events visible | Not yet verified |
| Recovery | Backup/restore or rollback procedure exercised | Not yet verified |
| Production | Deployment evidence and release ID | Not yet verified |
| End-to-end | Full customer journey succeeds | Not yet verified |

## Anti-theater rule

A green implementation checklist is not equivalent to production verification. Every status above changes only when evidence exists.

## Launch gate

Production launch is authorized only after all applicable P0 gates are green and the customer path has been exercised end-to-end.

**LOCKED.**
