# Phantom Mastermind — Fast Launch Runbook

## Objective

Provide the fastest safe path from a plain-language request to a verified public website.

## Hot path

1. Translate request into a Mastermind Directive.
2. Retrieve locked configuration and project memory.
3. Classify workload: static, standard, dynamic, full application.
4. Select a verified template/build plan when available.
5. Allocate a warm or ephemeral isolated worker.
6. Parallelize independent architecture, UI, content, data and test preparation.
7. Build and fingerprint the artifact.
8. Run security, functional and policy checks concurrently where dependencies allow.
9. Deploy through Phantom Pathway to the Phantom-owned runtime.
10. Verify endpoint reachability, TLS, health, readiness and artifact identity.
11. Write Phantom Footprint.
12. Mark LIVE only after proof.

## Latency accelerators

- warm worker pools for common workloads
- immutable dependency caches
- build cache keyed by source/config/dependency identity
- pre-approved component and site templates
- incremental builds
- parallel worker fan-out
- bounded model/tool context
- durable checkpoints for long jobs
- artifact reuse when identity proves equivalence
- early failure detection

## Never accelerate by

- skipping security checks
- skipping artifact identity
- bypassing Mastermind authorization
- exposing control-plane routes
- treating an external vendor as canonical
- claiming LIVE from local-only success
- suppressing Footprints

## Failure behavior

If a fast-path gate fails, automatically route to Engineering Detective. If production impact is active, escalate to Engineering EMT. Preserve evidence, checkpoint state, repair or rollback, verify, and record.
