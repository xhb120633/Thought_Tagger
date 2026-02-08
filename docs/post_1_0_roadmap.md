# Post-1.0 Roadmap (Deferred Scope)

This document tracks features explicitly deferred from the V1 baseline and referenced by the production readiness gap analysis.

## Purpose

- Keep V1 contracts stable while making deferred work visible.
- Provide a planning anchor for issues and milestone sequencing.
- Make scope decisions explicit for production signoff.

## Roadmap items

### R1. Replication strategy expansion ✅ Completed
**Status:** implemented with `weighted` and `stratified_round_robin` plus deterministic tie-breaking and test coverage.


### R4. Shared context in compare tasks ✅ Completed
**Status:** compare specs now support shared context via `compare_context` and compiler emits `compare_context.jsonl` plus context-ready template columns.

### R5. Shared context sidecar file support ✅ Completed
**Status:** compiler accepts `--context-sidecar` JSONL and validates deterministic `pair_id -> context` alignment before emitting context artifacts.

## Priority and sequencing

All previously deferred items have now been implemented.

## Tracking model

- Each roadmap item should map to one milestone and one integration test suite.
- Any schema changes must include migration notes and changelog entries.
- Roadmap status should be reviewed at every release cut.
