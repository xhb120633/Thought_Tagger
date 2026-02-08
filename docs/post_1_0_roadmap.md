# Post-1.0 Roadmap (Deferred Scope)

This document tracks features explicitly deferred from the V1 baseline and referenced by the production readiness gap analysis.

## Purpose

- Keep V1 contracts stable while making deferred work visible.
- Provide a planning anchor for issues and milestone sequencing.
- Make scope decisions explicit for production signoff.

## Roadmap items

### R1. Replication strategy expansion
**Current state (V1):** deterministic round-robin and load-balanced assignment strategies are supported.  
**Next step:** add advanced policies (for example weighted assignment and stratified coverage), with deterministic tie-breaking and test vectors.  
**Done when:** advanced policy options are spec-defined, implemented in compiler/workplan, and validated in examples.


### R4. Shared context in compare tasks
**Current state (V1):** compare tasks evaluate A/B items without shared context payload support.  
**Next step:** support shared context mode for compare screens so both candidates can be evaluated against the same reference context.
**Done when:** spec supports context payload, exporters render it consistently, and templates include context fields.

### R5. Shared context sidecar file support
**Current state (V1):** sidecar file ingestion for aligned compare context is not implemented.  
**Next step:** support optional sidecar file mapping (`pair_id -> context`) with deterministic pairing compatibility checks.  
**Done when:** compiler accepts sidecar inputs, validates alignment, and emits context-ready artifacts.

## Priority and sequencing

1. **R4 Shared context in compare tasks** (critical for compare quality).
2. **R5 Shared context sidecar support** (enables scalable context operations).
3. **R1 Replication strategy expansion**.

## Tracking model

- Each roadmap item should map to one milestone and one integration test suite.
- Any schema changes must include migration notes and changelog entries.
- Roadmap status should be reviewed at every release cut.
