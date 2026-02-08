# Example: A/B Compare CoT

This example demonstrates a `compare` task in `document` unitization mode with inline shared context and weighted assignment strategy.

## Run

```bash
npx thought-tagger-compile \
  --spec examples/ab_compare_cot/study.spec.json \
  --dataset examples/ab_compare_cot/dataset.csv \
  --out examples/ab_compare_cot/out
```

Generated outputs include a manifest, unit table, annotation template, event log template, assignment manifest, and compare context table.
