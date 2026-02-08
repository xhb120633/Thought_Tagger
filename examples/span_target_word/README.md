# Example: Span Target Word

This example demonstrates `target_span` mode for span-focused labeling workflows.

Each dataset row includes `target_spans` with half-open offsets `[char_start, char_end)` into `text`.
Compilation emits one unit per span with matching `char_start`, `char_end`, and `unit_text` slice.

## Run

```bash
npx thought-tagger-compile \
  --spec examples/span_target_word/study.spec.json \
  --dataset examples/span_target_word/dataset.jsonl \
  --out examples/span_target_word/out
```
