# ThoughtTagger — V1 Product Build (In Progress)

ThoughtTagger is an open-source, spec-driven annotation system for think-aloud / chain-of-thought (CoT) data.

This repository now includes a runnable V1 product slice:
- Core TypeScript contracts + deterministic unitization
- Compiler CLI (spec+dataset -> standardized artifacts)
- Studio web app with researcher setup + annotator workspace

## Implemented components

### `@thought-tagger/core`
- Study/rubric/data types
- Validation for study spec, questions, and dataset
- Deterministic unitization (`document`, `sentence_step`, `target_span`)

### `@thought-tagger/compiler`
- CLI compile pipeline from `study.spec.json` + dataset (`.jsonl` / `.csv`)
- Output artifacts:
  - `manifest.json`
  - `units.jsonl`
  - `annotation_template.csv`
  - `event_log_template.jsonl`

### `@thought-tagger/studio`
- Researcher setup UI (paste spec + dataset, create runtime)
- Annotator workspace UI:
  - document context + unit navigation
  - question rendering for `single_select`, `multi_select`, `free_text`, `choice`, `choice_with_rationale`
  - local autosave, server save, and JSON export

## Quickstart: Product UI

```bash
npm install
npm run studio
```

Then open `http://localhost:4173`.

## Quickstart: Compiler

```bash
npm install
npm run build
npm exec -w @thought-tagger/compiler thought-tagger-compile -- \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

## Current architecture targets still in progress

- Workplan expansion package
- Exporters: webapp/jsPsych/Prolific generators
- Production auth/deployment infra

See `docs/spec_reference.md` for baseline V1 specification.
