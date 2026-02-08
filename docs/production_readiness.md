# Production Readiness Status

## Executive summary

ThoughtTagger is **usable now for researcher workflows** where teams need deterministic compile/export plus clear deployment packaging.

- **Ready now:** compile pipeline, deterministic unitization, assignment workplans, exporter packages, example validations.
- **Needs operational ownership by deployer:** authentication, secure hosting, storage, backups, and monitoring.

This means the software is fit for real studies, but production responsibility is shared between toolkit + deployment team.

## Current capability status

### 1) Data pipeline
- Study spec + dataset validation are implemented.
- Deterministic outputs (`manifest`, `units`, templates) are generated reliably.
- Workplan expansion supports deterministic assignment strategies.

### 2) Deployment options
- Local/demo deployment path is documented and straightforward.
- Personal server (RA mode) path is documented via self-hosted static workspace.
- Participant platform packaging is documented for Pavlovia and Prolific.

### 3) Researcher usability
- Studio supports no-code-ish configuration and export workflows.
- Documentation now emphasizes plain-language deployment choices and checklists.

## Remaining risks before strict institutional signoff

1. **Hosting security controls** (outside this repository)
   - AuthN/AuthZ, TLS hardening, least-privilege access, data retention controls.

2. **Operational resilience** (outside this repository)
   - Monitoring/alerting, backup/restore drills, incident response ownership.

3. **Dependency hygiene** (ongoing)
   - Continue periodic audit/triage updates per `docs/dependency_audit.md`.

## Practical signoff checklist for a research lab

- [ ] `npm run check:all` passes on your release commit.
- [ ] Pilot sessions run successfully in chosen deployment mode.
- [ ] Data export path and storage location are confirmed.
- [ ] Team roles are defined (who maintains server, backups, and incident response).

## Bottom line

ThoughtTagger is currently in a **researcher-usable RC state** with strong core functionality; the final production quality depends mainly on deployment operations and governance.
