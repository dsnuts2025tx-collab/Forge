# PHANTOM MOTHERBOARD — MASTER CONFIGURATION

**Status: LOCKED**  
**Purpose:** First-party foundational control architecture for Phantom Insight and future Phantom products.

## 1. Prime Directive

Phantom Insight shall be rebuilt on a Phantom-controlled foundation. The motherboard is the reusable digital substrate; Insight is a product running on it, not the motherboard itself.

The architecture must favor first-party ownership, replaceability, observability, security, portability, and long-term evolution. External services may be used only where genuinely necessary and must sit behind a controlled External Boundary Layer. No third-party vendor becomes a foundational dependency merely for convenience.

## 2. Architectural Stack

Constitution
→ Master Canon
→ Phantom Motherboard
→ Forge Engineering Factory
→ Product Runtime
→ Phantom Insight
→ PHIA / Realms / Knowledge / Experiences

Forge builds and evolves the system. The Motherboard provides the durable platform primitives. Product systems consume those primitives through stable contracts.

## 3. Motherboard Core

### Identity
- User identity
- Session identity
- Service/workload identity
- Roles and permissions
- Capability-based authorization
- Tenant/household boundaries where applicable

### Policy
- Constitution enforcement
- Canon enforcement
- Safety policy
- Privacy policy
- Data classification
- Capability policy
- Change/approval policy

### Configuration
- Versioned configuration
- Environment separation
- Feature flags
- Runtime settings
- Safe defaults
- Configuration audit history

### Security
- Encryption in transit and at rest
- Secret/key lifecycle
- Least privilege
- Authentication and authorization
- Security event logging
- Dependency/supply-chain controls
- Vulnerability management
- Emergency revocation

### Audit
- Immutable-style append-only audit records where appropriate
- Actor/action/time/resource/result
- Configuration and policy changes
- Administrative actions
- Security events
- Release evidence

## 4. Data Plane

### Storage primitives
- Primary operational database
- Object/media storage
- Search indexes
- Knowledge graph
- Event/analytics store
- Cache where justified

### Data lifecycle
Collect → classify → validate → store → use → export/correct → retain → delete/anonymize according to policy.

Every sensitive data class must have an explicit owner, purpose, retention rule, access policy, and deletion/recovery behavior.

## 5. Phantom Event Spine

All important product/system events use versioned event contracts.

Examples:
- user.created
- onboarding.completed
- phia.session.started
- phia.session.completed
- realm.entered
- lesson.completed
- entitlement.granted
- entitlement.revoked
- subscription.started
- payment.failed
- content.published
- safety.flagged
- deployment.completed
- rollback.completed

Events must support idempotency, correlation IDs, schema versioning, replay/recovery strategy, and privacy classification.

## 6. Internal Service Bus

Internal systems communicate through stable contracts rather than direct coupling wherever practical.

Required concerns:
- API contracts
- Event contracts
- Versioning
- Idempotency
- Retries
- Dead-letter/error handling
- Timeouts
- Circuit breaking
- Rate limits
- Correlation/tracing

## 7. AI Substrate

The motherboard provides a common AI control layer:

- Model/provider abstraction
- Prompt/version registry
- Tool/capability registry
- Context assembly
- Retrieval/search interface
- Cost and latency telemetry
- Safety controls
- Evaluation datasets
- Regression evaluations
- Factuality/quality evaluation
- Model fallback policy
- Human/approval gates for consequential actions

PHIA is a product-level intelligence built on this substrate, not a hard-coded dependency on one model vendor.

## 8. Knowledge Substrate

Every knowledge object carries provenance:

source → evidence → author/creator → classification → confidence → review status → version → locale/cultural context → review date → supersession history.

The Knowledge Librarian owns catalog integrity, provenance, taxonomy, deduplication, archival, and retrieval quality.

## 9. Entitlement and Revenue Ledger

Revenue infrastructure is first-class:

- Product catalog
- Plans
- Entitlements
- Subscription state
- Transaction references
- Payment status
- Refund/cancellation state
- Revenue events
- Reconciliation

Payment networks may remain external regulated rails, but Phantom owns the product catalog, entitlement logic, customer state, reconciliation records, and access enforcement.

## 10. Observability and Diagnostics

Every production service must expose appropriate:
- Health checks
- Structured logs
- Metrics
- Distributed traces
- Error tracking
- Performance telemetry
- Business telemetry
- AI telemetry
- Alerts
- Incident history

No "works on my machine" completion claims.

## 11. Release and Recovery

Release lifecycle:
Proposed → designed → reviewed → built → tested → security checked → staged → deployed → smoke tested → observed → promoted/rolled back.

Recovery must include:
- Automated rollback where safe
- Backup and restore
- Data integrity verification
- Recovery objectives
- Disaster drills
- Incident runbooks

## 12. Dependency Boundary

Every external dependency must be registered with:
- Purpose
- Data accessed
- Security classification
- Cost
- Failure mode
- Availability assumptions
- Replacement strategy
- Contract/license requirements
- Whether it is foundational or replaceable

The External Boundary Layer isolates external networks, vendors, APIs, payment rails, research sources, and other third-party systems from the Phantom core.

## 13. Expansion Slots

The motherboard must support future products without copying foundational infrastructure:

- Phantom Insight
- New Phantom products
- New PHIA capabilities
- New realms
- New AI workers
- Future mobile interfaces
- Future AR/VR interfaces
- Future Phantom hardware

Extensions require contracts and compatibility review rather than new foundational primitives by default.

## 14. Big Daddy Motherboard Specialist

**Role:** Principal guardian of the Phantom Motherboard.

Responsibilities:
- Own motherboard architecture integrity
- Detect architectural drift
- Review foundational changes
- Identify missing primitives
- Reject unnecessary duplication
- Maintain contracts and invariants
- Coordinate cross-domain workers
- Ensure portability and replaceability
- Lead architecture recovery during incidents
- Continuously identify opportunities to simplify and strengthen the substrate

The Big Daddy Motherboard Specialist does not become a bottleneck. Routine work proceeds in parallel; only foundational decisions requiring authority are gated.

## 15. Big Daddy Librarian

**Role:** Chief knowledge and canonical-state librarian.

Responsibilities:
- Maintain canonical records
- Maintain taxonomy and knowledge graph integrity
- Track provenance and citations
- Detect duplicate/conflicting definitions
- Maintain version history
- Connect decisions to implementations
- Maintain cross-domain references
- Identify stale/deprecated information
- Preserve institutional memory

## 16. Big Daddy Workers

Big Daddy Workers are senior cross-domain outcome owners. They operate under the locked worker standard:

BUILD → ADDRESS → CORRECT → UPGRADE → VERIFY → ESCALATE → REPEAT.

They may:
- Inspect adjacent systems for related defects
- Coordinate parallel specialists
- Resolve problems within authority
- Propose architectural improvements
- Create tests and evidence
- Repair regressions
- Prepare safe migrations
- Escalate only decisions outside authority

They may not bypass security, policy, Canon, approval, payment, authentication, or lawful external safeguards.

## 17. Verification Standard

A component is not complete merely because code exists.

Completion requires appropriate evidence for:
- Functional behavior
- Integration
- Security
- Data integrity
- Accessibility
- Performance
- Reliability
- User experience
- Billing/entitlement behavior where applicable
- Production deployment

## 18. Anti-Drift Rule

If a new feature can be implemented using an existing motherboard primitive, reuse it.

If a proposed new primitive is necessary, document:
- Genuine architectural gap
- Alternatives considered
- Compatibility impact
- Security impact
- Operational impact
- Migration implications
- Approval

## 19. Mastermind Operating Loop

Observe → classify → prioritize → parallelize → build/fix → verify → integrate → deploy → observe production → learn → improve.

Optimize for verified time-to-working-result, not raw activity.

## 20. Lock

This configuration is the foundational target for the clean Phantom Insight rebuild. Changes to foundational primitives require explicit architectural review and documented justification. Product-level improvements may proceed rapidly when compatible with these invariants.
