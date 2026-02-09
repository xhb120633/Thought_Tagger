# ThoughtTagger Studio

Researcher-facing UI for upload → configure → preview → export.

## Run Studio locally

```bash
npm install
npm run dev -w @thought-tagger/studio
```

Open the URL printed in terminal (usually `http://localhost:5173`).

## Click-by-click instructions (researcher-friendly)

1. Open **StudySpec Configuration**.
2. Fill in **Study ID** and **Rubric Version**.
3. Choose:
   - **Task Type**
   - **Unitization Mode**
   - **Run Mode** (`participant` or `ra`)
4. If using multiple annotators, configure **Workplan**:
   - Add annotator IDs (comma-separated)
   - Set replication factor
5. In **Dataset Input**, choose `JSONL` or `CSV`.
6. Upload your dataset file or paste data into the text area.
7. In **Rubric Editor**, edit your rubric JSON.
8. Check **Preview** panel for expected document/unit counts.
9. Click **Export Compiler Bundle**.

## What Studio exports

- `manifest.json`
- `units.jsonl`
- `annotation_template.csv`
- `event_log_template.jsonl`
- `assignment_manifest.jsonl` (if workplan is enabled)
- `studio_bundle.json`
- `compare_context.jsonl` (only when `compare_context` is present in the input spec)

## After export: choose deployment path

- Local testing/demo or RA server: `docs/deployment/self_host.md`
- Pavlovia: `docs/deployment/pavlovia.md`
- Prolific: `docs/deployment/prolific.md`

## Notes

- CSV requires headers: `doc_id,text`
- Rubric content is persisted in browser local storage.
- `studio_bundle.json` includes `spec`, `rubric_config`, `docs`, `units`, and `generated_files` for round-trip reproducibility.
- In `ra` mode, Studio autosaves and can resume draft state.

## Current limitations

- **Compare pairing config in UI:** Not currently exposed. The Studio form does not provide controls for `compare_context` or compare pairing setup.
- **Advanced workplan strategies in UI:** Not exposed. Studio only supports `assignment_strategy: "round_robin"` and does not provide UI for alternative strategies.
- **Compare context file generation:** `compare_context.jsonl` is generated only if `spec.compare_context` is populated. The current Studio UI does not populate this field, so normal UI-based exports do not generate this file.
