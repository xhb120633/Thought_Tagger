# Quickstart (≤10 minutes)

1. Install dependencies:

```bash
npm install
```

2. Build compiler packages:

```bash
npm run build
```

3. Compile a sample study:

```bash
npm run compile -- \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

4. Start Studio UI locally:

```bash
npm run dev -w @thought-tagger/studio
```

5. In Studio, paste `study.spec.json` and dataset text to preview derived units.

6. Inspect output artifacts in `examples/sentence_labeling/out`:

- `manifest.json`
- `units.jsonl`
- `annotation_template.csv`
- `event_log_template.jsonl`
