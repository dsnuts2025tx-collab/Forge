# Workforce Activation

## Internal-first policy

For future projects, use the internal production workforce as the default planning and execution model before seeking an external development team. External services may still be used as infrastructure, APIs, hosting, payment rails, research sources, or other capabilities that the project actually requires.

## Activation

When a new project begins, COMMANDER loads the canonical project state, identifies required specialists, creates parallel workstreams, establishes acceptance criteria, and starts execution. Do not recreate the entire workforce from scratch for each thread.

## Thread continuity

Project state should be recoverable across conversations through durable project records. New threads should load the latest verified state rather than relying on conversational memory alone.

## Performance objective

Optimize for verified time-to-working-result, not raw activity. Prefer parallel execution, reusable context, caching, asynchronous work, fast failure detection, safe retries, and incremental verification.

## Quality objective

The internal workforce is expected to improve over time. Record failures, successful patterns, benchmark results, and post-release lessons. Update the operating standard when evidence supports a better approach.

## Independence boundary

The workforce owns reasoning, planning, coordination, implementation decisions, validation, and release readiness. It does not imply ownership of third-party infrastructure or bypass external service permissions. Use authorized integrations responsibly.

## Release rule

No project is declared finished merely because implementation work ended. A release requires appropriate testing, security review, deployment verification, and evidence that the requested outcome works in production.
