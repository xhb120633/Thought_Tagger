# Quickstart (≤10 minutes)

1. Install dependencies:

```bash
npm install
```

2. Build compiler packages:

```bash
npm run build
```

3. Compile a sample study and generate runnable local annotator bundle:

```bash
npx thought-tagger-compile \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

4. Run one full local annotation cycle and emit result files:

```bash
node tools/run-session-cycle.mjs \
  --bundle examples/sentence_labeling/out/webapp/study-bundle.json \
  --annotator demo_annotator \
  --out examples/sentence_labeling/out/session_results
```

5. Validate exported result schemas against V1 contract fields:

```bash
node tools/validate-annotation-table.mjs \
  examples/sentence_labeling/out/session_results/annotation_results.csv

node tools/validate-event-log.mjs \
  examples/sentence_labeling/out/session_results/event_log.jsonl
```

6. (Optional UI run) Serve the generated local app and complete the session in browser:

```bash
python -m http.server 4173 --directory examples/sentence_labeling/out/webapp
```

Open `http://localhost:4173`, complete all units, then download:
- `annotation_results.csv`
- `event_log.jsonl`

7. Start Studio UI locally (spec preview workflow):

```bash
npm run dev -w @thought-tagger/studio
```
