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
   - **Run Mode** (`pilot`, `ra`, etc.)
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

## After export: choose deployment path

- Local testing/demo or RA server: `docs/deployment/self_host.md`
- Pavlovia: `docs/deployment/pavlovia.md`
- Prolific: `docs/deployment/prolific.md`

## Notes

- CSV requires headers: `doc_id,text`
- Rubric content is persisted in browser local storage.
- In `ra` mode, Studio autosaves and can resume draft state.
