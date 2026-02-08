# Production Readiness Gap Analysis

This repository is already in a strong **MVP / pre-production** state:
- Multi-package build and tests are wired in CI (`npm ci` + `npm run check:all`).
- Compiler + exporters + example validation paths are implemented.
- Deployment walkthroughs exist for self-host, jsPsych/Pavlovia, and Prolific.

However, based on the current code/docs, it is **not yet a final production release**. Below is what remains.

## 1) Product scope that is explicitly deferred

The spec still marks several capabilities as placeholders/deferred:
- Replication strategy implementation details.
- Work-distribution optimization details.

These are listed directly in `docs/spec_reference.md`, and are now tracked in `docs/post_1_0_roadmap.md` for explicit post-1.0 planning.

## 2) Versioning and release maturity

All workspaces are still on `0.1.0`, and the root README identifies the repo as an "MVP Compiler Scaffold", which signals pre-1.0 release maturity.

To be production-final, define a release policy (e.g., semantic versioning + changelog + tagged releases), then cut a `1.0.0` when contracts are stable.

Status update:
- Release policy documented in `docs/release_policy.md`.
- Changelog scaffold added in `CHANGELOG.md`.

## 3) Runtime platform hardening (Studio/web deployments)

Current Studio behavior is browser-local and intentionally lightweight:
- RA autosave uses `localStorage`.
- Export is local browser download.

Before final production rollout, add/standardize:
- Authentication + role boundaries (researcher/admin/annotator).
- Server-side persistence for drafts/sessions/results (not only browser storage).
- Operational controls: backup/restore, retention rules, auditability.
- Security headers / CSP / HTTPS-only deployment defaults.

Status update:
- Security/compliance baseline documented in `docs/security_compliance.md`.

## 4) Data governance and compliance controls

The project handles annotation datasets and potentially sensitive research data. A production-final release should include:
- Explicit PII handling policy.
- Data retention + deletion policy.
- Access logging and least-privilege operational model.
- Incident response process references in docs.

Status update:
- Baseline policy documented in `docs/security_compliance.md`.

## 5) Operational readiness (SRE-style)

CI verifies build/test/output correctness, but production operations need additional readiness artifacts:
- Error monitoring/alerting strategy.
- Performance baselines and load expectations.
- Rollback/runbook procedures.
- Environment configuration matrix (dev/staging/prod).

Status update:
- Baseline runbook documented in `docs/operations_runbook.md`.
- Environment matrix documented in `docs/environment_matrix.md`.

## 6) Supply-chain and dependency hygiene

A routine `npm ci` currently reports moderate vulnerabilities in dependencies (environment-specific output may vary).

Before final production signoff:
- Run `npm audit` triage and document accepted risk.
- Pin/update vulnerable transitive deps where possible.
- Add dependency review cadence (or automated updates with review gates).

Status update:
- Triage process documented in `docs/dependency_audit.md`.

## 7) Suggested "production-final" acceptance gate

A practical gate to declare production readiness:
1. `npm run check:all` green in CI.
2. No unresolved high/critical dependency findings.
3. Deferred spec items either implemented (for example `show_if` conditional flows) or moved to an explicit post-1.0 roadmap.
4. Security/compliance docs added (PII, retention, access model).
5. Runbooks and monitoring in place for deployed environments.
6. First stable release tagged with changelog and migration notes.

## Bottom line

**Current status:** solid MVP with good deterministic compiler/exporter foundations and documented deployment workflows.

**Remaining for final production-ready state:** complete remaining deferred product features, formalize release governance, and add production security/operations/compliance controls.
