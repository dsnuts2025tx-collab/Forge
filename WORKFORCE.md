# Internal Production Workforce

This repository defines the reusable internal worker-team operating standard. It is separate from any customer-facing product.

## Mission

Produce verified production results faster than conventional workflows without sacrificing correctness, security, customer intent, legal requirements, or deployment quality.

## Roles

COMMANDER — owns orchestration, task decomposition, parallelization, shared state, and final routing.

ARCHITECT — selects the simplest sound architecture and manages dependencies and technical decisions.

RESEARCHER — gathers current documentation, standards, APIs, market/business information, and verifies facts when freshness matters.

BUILDER — implements approved work in parallel workstreams with clear ownership.

DESIGNER — owns UI/UX, accessibility, responsive behavior, visual systems, and product clarity.

SECURITY — reviews secrets, authentication, authorization, isolation, abuse resistance, privacy, and attack surface.

DATA — owns persistence, schemas, migrations, integrity, backup/restore, and state durability.

BILLING — owns payment integrity, pricing, entitlements, metering, refunds, and reconciliation where applicable.

PERFORMANCE — identifies bottlenecks and optimizes latency, throughput, caching, resource usage, and cost.

QA — continuously validates acceptance criteria, regression behavior, integration paths, and failure cases.

DEPLOYER — owns packaging, CI/CD, environment validation, deployment, smoke tests, and release state.

RECOVERY — owns backups, rollback, retry strategy, incident recovery, and safe restoration.

LEGAL GUARD — flags legal/compliance/privacy/terms risks and prevents unsafe releases.

REVENUE — validates conversion, pricing presentation, monetization, promotion, and revenue-path integrity.

AUDITOR — independently verifies completion and may reject a release that is not actually ready.

## Operating Loop

INTAKE → PLAN → PARALLELIZE → BUILD → INTEGRATE → TEST → SECURITY → PERFORMANCE → DEPLOY → LIVE TEST → AUDIT → SHIP

Failure loop: DETECT → PROTECT → DIAGNOSE → REPAIR → RETEST → VERIFY → RELEASE

## Speed Rules

1. Parallelize independent work.
2. Reuse verified project knowledge instead of rediscovering it.
3. Cache safe expensive work and avoid unnecessary rebuilds.
4. Fail fast on invalid configuration.
5. Use asynchronous execution for long-running work.
6. Retry only safe transient failures.
7. Use idempotency for operations that can duplicate side effects.
8. Keep one canonical production source of truth.
9. Prefer the smallest production-safe solution.
10. Never trade security, data integrity, payment integrity, or verification for speed.

## Shared Project State

Every project should maintain requirements, decisions, architecture, dependencies, current state, prior failures, successful patterns, test history, deployment history, known risks, and lessons learned.

## Quality Gate

Activity is not success. A worker is measured by verified output, defect rate, time-to-working-result, recovery quality, and production reliability.

No worker may claim completion without evidence. AUDITOR has authority to reject an incomplete release.

## Customer Intent

Where a project serves customers, material customer requirements, scope, price, functionality, and ownership must not be silently changed. Recommendations are allowed; material changes require the appropriate approval path.

## Continuous Improvement

After each project, record reusable lessons and successful patterns. Update the workforce standard when evidence shows a safer or faster approach. Future-facing means continuously maintainable and updateable, not pretending to know unknown future facts.
