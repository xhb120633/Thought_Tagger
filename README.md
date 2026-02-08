# ThoughtTagger — Design Logics + MVP Compiler Scaffold

ThoughtTagger is an open-source, spec-driven annotation system designed for think-aloud / chain-of-thought (CoT) data.

This repository currently includes:
- Design + V1 spec documents
- TypeScript MVP packages for core contracts and a first compiler CLI scaffold

## What is implemented now

### Packages
- `@thought-tagger/core`
  - Study spec types and validation
  - Deterministic unitization for `document`, `sentence_step`, `target_span`
- `@thought-tagger/compiler`
  - Reads `study.spec.json` and dataset (`.jsonl` / `.csv`)
  - Validates input contracts
  - Generates starter output artifacts:
    - `manifest.json`
    - `units.jsonl`
    - `annotation_template.csv`
    - `event_log_template.jsonl`
    - `assignment_manifest.jsonl` (when `workplan` is configured in spec)
- `@thought-tagger/workplan`
  - Deterministic assignment manifest expansion with round-robin replication

## Quickstart

```bash
npm install
npm run build
npx thought-tagger-compile \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

## Repository framework (target architecture)

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
