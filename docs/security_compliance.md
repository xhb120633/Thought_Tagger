# Security and Compliance Baseline

This document defines the minimum security/compliance controls required for production deployments of ThoughtTagger.

## 1) Data classification

At minimum, deployments should classify data into:
- **Public metadata** (non-sensitive operational metadata).
- **Research operational data** (study configs, annotation outputs).
- **Sensitive data** (raw participant text that may contain PII).

Default handling assumption: annotation datasets may include sensitive data.

## 2) PII handling policy

- Collect only fields required by study protocol.
- Avoid storing direct identifiers unless explicitly required.
- Where feasible, pseudonymize annotator/participant identifiers before persistence.
- Do not place sensitive exports in public buckets or unauthenticated storage.

## 3) Retention and deletion

- Define retention windows per deployment (for example drafts, event logs, exports, backups).
- Support deletion requests by study ID / subject ID where legally required.
- Document backup retention separately from primary datastore retention.

## 4) Access control model

Recommended role model:
- **Admin:** platform configuration, key management, access review.
- **Researcher:** create studies, view/manage project data.
- **Annotator:** execute assigned tasks, view only permitted task scope.

Principles:
- least privilege,
- no shared admin credentials,
- periodic access review.

## 5) Logging and auditability

Production deployments should log:
- authentication and authorization outcomes,
- configuration changes,
- export/download actions,
- data deletion and restoration actions.

Audit logs should be immutable or append-only and protected from ordinary user modification.

## 6) Security baseline for web deployments

- Enforce HTTPS-only transport.
- Set CSP and common secure headers.
- Use secure cookie/session defaults where applicable.
- Maintain dependency update cadence and vulnerability triage records.

## 7) Incident response references

Deployment operators should maintain:
- incident severity definitions,
- on-call/contact path,
- containment and recovery checklist,
- post-incident review template.

See also: `docs/operations_runbook.md`.
