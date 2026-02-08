# Active Roadmap Toward a Fully Researcher-Usable Product

This roadmap focuses on practical needs for psychology researchers who may have minimal coding background.

## Roadmap status legend

- **Active:** planned and not yet complete
- **Queued:** next after active items
- **Completed:** done and shipped

## Active plans

### A1. One-page "which deployment should I pick?" onboarding (Active)
**Goal:** reduce setup confusion for first-time researchers.  
**Deliverable:** clear decision flow that maps to local demo, RA server, Pavlovia, and Prolific.  
**Why it matters:** most support requests come from deployment-path uncertainty.

### A2. Researcher-first checklists for launch readiness (Active)
**Goal:** make pre-launch quality checks understandable without engineering jargon.  
**Deliverable:** per-platform checklists (pilot complete, IDs preserved, output verified, backup plan set).

### A3. Minimal "handoff bundle" standard for RAs (Active)
**Goal:** allow a PI to hand off a deployable package to RAs with low friction.  
**Deliverable:** documented folder standard + short handoff instructions.

## Queued plans

### Q1. Optional managed deployment templates (Queued)
- Static-host templates (e.g., Nginx/Cloud storage/CDN) with copy-paste defaults.

### Q2. Guided QA script for non-technical teams (Queued)
- A single command that checks expected files and key fields for each deployment mode.

### Q3. Data management templates (Queued)
- Plain-language SOP templates for retention, backup cadence, and incident logging.

## Completed items

### C1. Replication strategy expansion ✅
Implemented `weighted` and `stratified_round_robin` with deterministic tie-breaking and tests.

### C2. Compare-task shared context ✅
Implemented `compare_context` support and context-aware compiler outputs.

### C3. Context sidecar support ✅
Implemented deterministic `--context-sidecar` handling with alignment validation.

## Planning notes

- Roadmap should prioritize **lower cognitive load** over feature count.
- Every roadmap item should map to a concrete researcher pain point.
- Status is reviewed at each release cut.
