# Example: Sentence Labeling

Minimal runnable example for the compiler MVP.

## Run

```bash
npm install
npm run build
npx thought-tagger-compile \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

Expected outputs are written to `examples/sentence_labeling/out/`.
