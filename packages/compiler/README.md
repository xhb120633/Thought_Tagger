# @thought-tagger/compiler

CLI and compile pipeline that turns a study spec + dataset into starter artifacts.

## CLI

```bash
npm run build -w @thought-tagger/compiler
npx thought-tagger-compile --spec <spec.json> --dataset <dataset.csv|dataset.jsonl> --out <output_dir>
```

## Outputs

- `manifest.json`
- `units.jsonl`
- `annotation_template.csv`
- `event_log_template.jsonl`
- `assignment_manifest.jsonl` (optional; emitted when `workplan` is present in study spec)
