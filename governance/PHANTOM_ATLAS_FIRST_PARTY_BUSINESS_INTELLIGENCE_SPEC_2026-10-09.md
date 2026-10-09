# Phantom Atlas — First-Party Business Intelligence Platform
**Status:** SPECIFICATION / IMPLEMENTATION NOT YET VERIFIED  
**Authority:** Phantom  
**Owner attribution:** Donald Long III / Phantom  
**Policy:** NO_EVIDENCE_NO_CLAIM

## Purpose
Phantom Atlas is Phantom's own first-party company and business intelligence capability. ZoomInfo is a market benchmark only; Phantom Atlas must not depend on, impersonate, or claim a connection to ZoomInfo. Build and govern Atlas within the Phantom ecosystem.

## Product boundary
Atlas may organize and analyze business/company intelligence using sources Phantom is authorized to access. It must record provenance, collection time, source terms/licensing, confidence, freshness, and permitted uses for each field or record. It must not fabricate contacts, company facts, intent signals, employment histories, or verification labels.

## Core capabilities
1. Company discovery and normalized company profiles.
2. Source-backed business/contact records only where collection and use are authorized.
3. Company relationships, industry classifications, size bands, locations, and public business signals with source citations.
4. Data enrichment with field-level provenance, timestamps, confidence, freshness, and conflict resolution.
5. Search, filters, saved lists, exports, and API access with tenant/role-based permissions.
6. Deduplication and entity resolution with reversible merge history.
7. Monitoring of authorized public business signals and change history.
8. Evidence and audit log for queries, imports, edits, exports, and access.
9. Privacy, retention, deletion, opt-out, suppression, and jurisdiction-specific compliance controls.
10. Human review for low-confidence matches, sensitive use cases, and consequential decisions.

## Source and compliance gates
- Use first-party, licensed, public, or user-authorized sources only, in accordance with source terms and applicable law.
- Do not bypass access controls, scrape behind authentication without permission, or republish restricted data.
- Do not label an email, phone number, title, affiliation, or intent signal as verified unless a documented verification process supports that exact field.
- Respect opt-outs, deletion requests, retention limits, purpose limitation, and applicable privacy rules.
- Keep sensitive personal data out unless specifically necessary, authorized, and subject to approved controls.
- No marketing outreach or bulk export workflow should be enabled until consent, suppression, and audit controls are tested.

## Trustworthy record model
Every field should retain, where applicable:
- stable entity/field identifier;
- normalized value and original source value;
- source/provider and source record identifier;
- collection timestamp and last-verified timestamp;
- source URL or evidence reference;
- license/permission and allowed-use classification;
- confidence and freshness status;
- transformation/enrichment history;
- retention/deletion state and opt-out/suppression state.

## Security and governance
- Phantom remains the canonical authority; vendors are data sources or processors, never canonical decision-makers.
- Least-privilege access, secret management, encryption in transit and at rest, tenant isolation, audit trails, and abuse-rate limits are release requirements.
- Separate company-level information from personal contact data and apply stricter access and retention to personal data.
- All generated inferences must be labeled as inferences, not facts.
- Preserve owner-originated work and clearly distinguish third-party data, licensed data, and generated implementation.
- No public-live claim until independent build, security, privacy, data-rights, and end-to-end verification evidence passes.
- A release must not regress validated behavior; maintain a known-good release and rollback path.

## Initial MVP
1. Company search over an authorized seed dataset.
2. Company profile page with field-level source/provenance display.
3. Import pipeline with validation, deduplication, and quarantine for uncertain matches.
4. Search/filter and saved lists.
5. Role-based access, audit events, opt-out/suppression, and deletion handling.
6. Test fixtures for stale, conflicting, duplicate, missing, and unauthorized data.
7. Independent acceptance tests and a documented rollback rehearsal.

## Acceptance gates
- Every displayed non-derived field has traceable provenance or is explicitly marked unknown.
- No invented records; no unlicensed/unauthorized data source enters production.
- Deletion and suppression propagate to search, exports, caches, and derived records as applicable.
- Unauthorized access and bulk export attempts are denied and audited.
- Duplicate merges are explainable and reversible.
- Privacy, security, and source-rights review passes.
- Build/test results, reviewer identity, artifact hashes, deployment URL, and rollback evidence are recorded before changing status to deployed.

## Current evidence boundary
This document specifies the first-party Phantom Atlas capability. It does not prove that a running Atlas application, production dataset, external source connection, or deployment already exists. Those statuses remain unverified until supported by real artifacts and test/deployment receipts.
