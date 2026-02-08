# Post-1.0 Roadmap (Deferred Scope)

This document tracks features explicitly deferred from the V1 baseline and referenced by the production readiness gap analysis.

## Purpose

- Keep V1 contracts stable while making deferred work visible.
- Provide a planning anchor for issues and milestone sequencing.
- Make scope decisions explicit for production signoff.

## Roadmap items

### R1. Replication strategy expansion
**Current state (V1):** deterministic round-robin replication through the workplan package.  
**Next step:** add configurable replication policies (for example weighted assignment and stratified coverage), with deterministic tie-breaking and test vectors.  
**Done when:** policy options are spec-defined, implemented in compiler/workplan, and validated in examples.

### R2. Work-distribution optimization
**Current state (V1):** deterministic assignment generation without dynamic optimization.  
**Next step:** introduce optimization goals (for example balancing by metadata, throughput targets, or annotator load), while preserving reproducibility guarantees.  
**Done when:** optimization mode can be toggled, emits explainable manifests, and has regression tests.

## Priority and sequencing

1. **R1 Replication strategy expansion**.
2. **R2 Work-distribution optimization**.

## Tracking model

- Each roadmap item should map to one milestone and one integration test suite.
- Any schema changes must include migration notes and changelog entries.
- Roadmap status should be reviewed at every release cut.
