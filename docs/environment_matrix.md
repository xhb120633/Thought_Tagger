# Environment Configuration Matrix

Use this matrix to keep environment expectations explicit and auditable.

| Dimension | Development | Staging | Production |
| --- | --- | --- | --- |
| Purpose | Local iteration and debugging | Pre-release validation with production-like settings | Live researcher/annotator operations |
| Data sensitivity | Synthetic or scrubbed data preferred | Limited real-like data; controlled access | Real study data; strict controls |
| AuthN/AuthZ | Optional for local-only testing | Required | Required |
| Transport security | Localhost allowed | HTTPS required | HTTPS required |
| Persistence | Local/dev databases acceptable | Managed persistent storage | Managed persistent storage + backups |
| Logging/audit | Basic logs | Structured logs + retention | Structured logs + audit retention |
| Backup policy | Optional | Required; restore tested periodically | Required; restore tested on schedule |
| Monitoring | Basic health checks | Alerts enabled | Alerts + escalation/on-call |
| Change control | Lightweight | Release candidate process | Formal release + rollback plan |

## Notes

- Record concrete implementation details for each deployment target under this matrix.
- Keep this table synchronized with `docs/operations_runbook.md` and `docs/security_compliance.md`.
