# @thought-tagger/compiler

CLI and compile pipeline that turns a study spec + dataset into starter artifacts.

## CLI

```bash
npm run build -w @thought-tagger/compiler
npx thought-tagger-compile --spec <spec.json> --dataset <dataset.csv|dataset.jsonl> --out <output_dir> [--context-sidecar <context.jsonl>]
```

## Dataset input notes

- Both `.jsonl` and `.csv` are supported.
- Required columns/fields: `doc_id`, `text`.
- CSV supports quoted values (including embedded commas and escaped double quotes).
- CSV columns prefixed with `meta.` are loaded into per-document `meta` fields.
- Optional `pair_id` is supported for compare context alignment.

## Outputs

- `manifest.json`
- `units.jsonl`
- `annotation_template.csv`
- `event_log_template.jsonl`
- `assignment_manifest.jsonl` (optional; emitted when `workplan` is present in study spec)
- `compare_context.jsonl` (optional; emitted when compare context mode is configured)


Compare context notes:
- Use `compare_context.mode = inline_meta` to map context from a metadata key (e.g. `meta.shared_context`).
- Use `compare_context.mode = sidecar` with `--context-sidecar` JSONL and pair-id alignment fields.
