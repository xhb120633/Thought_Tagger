# ThoughtTagger — Design Logics + Production Compiler Toolkit

ThoughtTagger is an open-source, spec-driven annotation system designed for think-aloud / chain-of-thought (CoT) data.

## Production baseline features

### Packages
- `@thought-tagger/core`
  - Study spec types and validation
  - Deterministic unitization for `document`, `sentence_step`, `target_span`
  - Segmentation-version hashing for deterministic outputs
- `@thought-tagger/compiler`
  - Reads `study.spec.json` and dataset (`.jsonl` / `.csv`)
  - Validates input contracts
  - Generates output artifacts:
    - `manifest.json`
    - `units.jsonl`
    - `annotation_template.csv`
    - `event_log_template.jsonl`
    - `assignment_manifest.jsonl` (when `workplan` is configured)
- `@thought-tagger/workplan`
  - Deterministic assignment manifest expansion with round-robin and load-balanced strategies

## Installation

```bash
npm install
```

## Quickstart

```bash
npm run build
npm run compile -- \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

## Useful commands

```bash
npm run build
npm test
npm run build -w @thought-tagger/studio
npm run validate:examples
npm run smoke:exporters
npm run check:all
```

## Documentation index

### Getting started
- [Installation guide](docs/installation.md)
- [Quickstart tutorial](docs/quickstart.md)
- [Spec reference](docs/spec_reference.md)

### Deployment guides
- [Self-hosted web workspace deployment](docs/deployment/self_host.md)
- [Pavlovia/jsPsych deployment](docs/deployment/pavlovia.md)
- [Prolific integration deployment](docs/deployment/prolific.md)

### Production readiness
- [Production readiness gap analysis](docs/production_readiness.md)
- [Post-1.0 roadmap for deferred scope](docs/post_1_0_roadmap.md)
- [Release policy](docs/release_policy.md)
- [Security and compliance baseline](docs/security_compliance.md)
- [Operations runbook](docs/operations_runbook.md)
- [Environment configuration matrix](docs/environment_matrix.md)
- [Dependency audit and triage process](docs/dependency_audit.md)

### End-to-end workflow
- [Raw dataset → deployed workspace → collected results walkthrough](docs/workflow_dataset_to_results.md)

### Troubleshooting
- [Troubleshooting guide](docs/troubleshooting.md)

## Repository framework

```
ThoughtTagger/
├─ packages/
│  ├─ core/
│  ├─ compiler/
│  ├─ workplan/
│  ├─ exporters/
│  │   ├─ webapp/
│  │   ├─ jspsych/
│  │   └─ prolific/
├─ apps/
│  └─ studio/
├─ examples/
└─ docs/
```

See [docs/spec_reference.md](docs/spec_reference.md) for baseline V1 requirements and constraints.
