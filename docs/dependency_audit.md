# Dependency Audit and Vulnerability Triage

This document standardizes dependency risk review before production releases.

## 1) Review cadence

- Run `npm audit` at least once per release cycle.
- Re-run after dependency updates or lockfile regeneration.

## 2) Triage process

For each finding:
1. Confirm package and affected path (direct vs transitive).
2. Determine severity and exploitability in this deployment context.
3. Choose an action:
   - update/patch,
   - pin/override,
   - temporarily accept with documented rationale.
4. Record target date/owner for unresolved risk.

## 3) Acceptance rules

- **High/Critical:** resolve before production signoff unless an exception is approved and documented.
- **Moderate/Low:** track with remediation plan and review date.

## 4) Documentation template

Use this template per finding:

- Finding ID / package:
- Severity:
- Affected workspace(s):
- Reachability assessment:
- Decision:
- Mitigation:
- Owner:
- Due date:
- Status:

## 5) Release gate linkage

Dependency triage completion is part of the release checklist in `docs/release_policy.md`.
