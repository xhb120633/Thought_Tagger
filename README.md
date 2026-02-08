# ThoughtTagger — Design Logics + MVP Compiler Scaffold

ThoughtTagger is an open-source, spec-driven annotation system designed for think-aloud / chain-of-thought (CoT) data.

This repository includes:
- Design + V1 spec documents
- TypeScript core contracts, compiler pipeline, and assignment expansion
- A Studio UI preview app
- Runnable example studies

## What is implemented now

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
  - Deterministic assignment manifest expansion with round-robin replication

## Installation

```bash
npm install
```

## Quickstart

```bash
npm run build
npx thought-tagger-compile \
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
npm run check:all
```

## Documentation

- Installation guide: `docs/installation.md`
- Quickstart tutorial: `docs/quickstart.md`
- Spec reference: `docs/spec_reference.md`
- Deployment guides:
  - `docs/deployment/self_host.md`
    - `docs/deployment/prolific.md`
  - `docs/deployment/pavlovia.md`
- Troubleshooting: `docs/troubleshooting.md`

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

See `docs/spec_reference.md` for baseline V1 requirements and constraints.
