# Operations Runbook (Baseline)

This runbook provides a minimum operational playbook for production ThoughtTagger deployments.

## 1) Service health and monitoring

Track at least:
- service availability/uptime,
- error rates and failed writes,
- latency percentiles for critical API paths,
- storage utilization and backup status.

## 2) Alerting

Define alert thresholds for:
- sustained high error rate,
- datastore connectivity failures,
- backup failures,
- TLS/certificate expiration windows.

Each alert should map to an owner and escalation path.

## 3) Backup and restore

- Backup frequency: define RPO target.
- Restore target: define RTO target.
- Verify restore procedures on a recurring cadence (for example monthly).
- Keep backup encryption and key access policies documented.

## 4) Deployment and rollback

Before deployment:
- verify CI green (`npm run check:all`),
- validate environment configuration,
- confirm migration compatibility.

Rollback procedure:
1. Halt rollout.
2. Revert to last known-good release tag.
3. Re-run smoke checks.
4. Communicate status and impact.

## 5) Change management

For each production change, capture:
- change summary,
- risk assessment,
- rollout window,
- validation and rollback steps,
- post-deploy verification results.

## 6) Incident workflow

1. Detect and triage severity.
2. Contain impact.
3. Restore service.
4. Validate data integrity.
5. Publish postmortem with action items.

## 7) Environment documentation

Maintain environment-specific values and controls in `docs/environment_matrix.md`.
