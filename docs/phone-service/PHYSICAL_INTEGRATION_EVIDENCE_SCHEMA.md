# Phone Service — Physical Integration Evidence Schema

## Purpose

This schema defines the minimum evidence required before Forge may treat cellular or satellite connectivity as physically verified. It records evidence; it does not create carrier authorization, service entitlement, device compatibility, or connectivity.

## Cellular evidence

A cellular acceptance record MUST identify:

- provider name and integration environment
- provider account/tenant reference (non-secret)
- SIM/eSIM provisioning reference (non-secret; never record the secret)
- device make/model and hardware identifier (redacted where appropriate)
- OS/build version
- radio technology observed (for example LTE/5G)
- timestamp in UTC
- test location or test-lab reference
- Wi-Fi state explicitly recorded as disabled/unavailable
- cellular registration state observed on the physical device
- data-plane request/response observed over cellular
- provider-side authorization evidence
- authoritative usage/billing correlation reference
- funding coverage decision
- operator/tester identity

The record MUST NOT contain passwords, OAuth client secrets, API tokens, SIM authentication secrets, private keys, or raw subscriber credentials.

## Satellite fallback evidence

A satellite acceptance record MUST identify:

- satellite-capable device/model
- OS/build and relevant satellite API capability
- carrier/provider entitlement reference (non-secret)
- compatible service/device agreement reference
- timestamp in UTC
- terrestrial/cellular path state immediately before fallback
- satellite capability/state observed on the physical device
- actual satellite data/message transaction observed, where supported by the selected service
- provider-side evidence/correlation reference
- return-to-cellular observation, if tested

Capability discovery alone is NOT satellite service proof.

## Freshness

Evidence timestamps MUST be valid, non-future timestamps. Production acceptance SHOULD require cellular evidence no older than 24 hours. Satellite evidence MUST use the same freshness window whenever satellite is represented as operational.

## Promotion rule

A production gate MUST fail closed if any required evidence is absent, stale, contradictory, unverifiable, or based only on simulation/mocks. Customer price `$0` does not waive provider authorization, device compatibility, usage accounting, billing reconciliation, or funding coverage.

## Evidence lifecycle

`CAPTURED -> VERIFIED -> ACCEPTED -> EXPIRED`

Any material change to provider, credentials, SIM/eSIM, device, OS/radio stack, entitlement, or service agreement invalidates the affected acceptance record until re-verified.
