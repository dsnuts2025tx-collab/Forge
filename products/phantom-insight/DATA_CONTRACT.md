# Phantom Insight — Data Contract

**Status: LOCKED**

## Ownership boundary

Every user-owned object is scoped to `accountId`. Authorization is evaluated server-side for every read, write, update, export, and deletion.

## Core entities

`accounts`
- id
- created_at
- status

`users`
- id
- account_id
- email_identity_ref
- display_name
- created_at
- updated_at

`sessions`
- id
- account_id
- expires_at
- revoked_at

`conversations`
- id
- account_id
- realm
- created_at
- updated_at

`messages`
- id
- conversation_id
- account_id
- role
- content
- model_release_id
- created_at

`journal_entries`
- id
- account_id
- title
- body
- visibility
- created_at
- updated_at

`dream_entries`
- id
- account_id
- content
- interpretation_notes
- created_at

`learning_progress`
- id
- account_id
- path_id
- progress
- completed_at

`subscriptions`
- id
- account_id
- provider_customer_ref
- provider_subscription_ref
- provider_price_ref
- status
- current_period_end
- cancel_at_period_end
- updated_at

`entitlements`
- id
- account_id
- tier
- active
- feature_set_version
- source_event_id
- updated_at

`webhook_events`
- provider
- event_id
- event_type
- received_at
- processed_at
- processing_status
- payload_hash

`audit_events`
- id
- account_id
- actor_type
- event_type
- request_id
- release_id
- metadata
- created_at

## Data safety

- Never store provider secrets in these tables.
- Minimize sensitive data.
- Do not expose internal audit metadata to ordinary users.
- Use immutable audit/event records where required.
- Support account data export and deletion according to product policy.
- Backups must have defined retention and restoration procedures.

## Consistency

Subscription state and entitlement state must be reconciled from authoritative events. Client state is advisory only.

PHIA memory retrieval must be explicitly scoped to the authenticated account and to memory IDs authorized for the request.

**LOCKED.**
