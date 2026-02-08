# Self-host Deployment (Local-first V1)

This flow deploys the generated annotator bundle locally (or on any static host) and collects contract-compliant outputs.

## 1) Build and compile

```bash
npm install
npm run build
npx thought-tagger-compile \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

## 2) Launch the bundled local app

```bash
python -m http.server 4173 --directory examples/sentence_labeling/out/webapp
```

Visit `http://localhost:4173` and run through all units.

## 3) Collect exported artifacts

Use in-app download buttons after session completion and save these files:

- `annotation_results.csv`
- `event_log.jsonl`

(Headless collection alternative)

```bash
node tools/run-session-cycle.mjs \
  --bundle examples/sentence_labeling/out/webapp/study-bundle.json \
  --annotator self_host_runner \
  --out examples/sentence_labeling/out/session_results
```

## 4) Validate contract fields before ingest

```bash
node tools/validate-annotation-table.mjs \
  examples/sentence_labeling/out/session_results/annotation_results.csv

node tools/validate-event-log.mjs \
  examples/sentence_labeling/out/session_results/event_log.jsonl
```

If both validators pass, files satisfy the V1 output contract field set from `docs/spec_reference.md`.
