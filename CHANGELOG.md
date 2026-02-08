# Changelog

All notable changes to this project should be documented in this file.

The format is based on Keep a Changelog principles and follows Semantic Versioning.

## [Unreleased]

### Added
- Production governance docs for release policy, deferred roadmap, security/compliance baseline, operations runbook, environment matrix, and dependency audit triage process.
- Conditional question flow support in study spec validation via `questions[].show_if` with parent/option integrity checks.
- Compiler manifest fields `question_count` and `conditional_question_count` for downstream tooling visibility.
- Compare shared-context support for compare tasks via `compare.shared_context_mode=inline_meta`, including compiler `compare_context.jsonl` emission and strict metadata validation.
- Compare shared-context sidecar ingestion via `compare.shared_context_mode=sidecar_jsonl` with `doc_id` coverage validation.
- Manifest fields `compare_shared_context_mode` and `shared_context_unit_count` for compare-context observability.

### Changed
- README and production-readiness documentation index expanded to reference production controls and planning artifacts.

## [0.1.0] - Initial MVP

### Added
- Multi-package baseline for core spec, compiler, workplan, exporters, and studio app.
- Deterministic compilation artifacts and example validation flows.
