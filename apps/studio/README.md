# ThoughtTagger Studio

Researcher-facing UI for upload → configure → export.

## Run

```bash
npm install
npm run dev -w @thought-tagger/studio
```

## Click-by-click workflow

1. Open Studio and go to **StudySpec Configuration**.
2. Fill **Study ID** and **Rubric Version**.
3. Choose **Task Type**, **Unitization Mode**, and **Run Mode**.
4. Configure **Workplan**:
   - Enter comma-separated annotator IDs.
   - Set replication factor.
5. In **Dataset Input**, choose the format (`JSONL` or `CSV`).
6. Upload a `.jsonl` or `.csv` file with **Upload dataset**, or paste raw rows into the dataset textarea.
7. Edit rubric JSON in **Rubric Editor (persisted)**. The rubric content is persisted in local storage automatically.
8. If **Run Mode = ra**, Studio autosaves the full in-progress state and surfaces a **Resume draft** prompt next time the app opens.
9. Verify the **Preview** section updates with document and unit counts.
10. Click **Export Compiler Bundle** to download compiler-compatible artifacts:
    - `manifest.json`
    - `units.jsonl`
    - `annotation_template.csv`
    - `event_log_template.jsonl`
    - `assignment_manifest.jsonl` (when workplan is configured)
    - `studio_bundle.json` convenience bundle

## Notes

- CSV upload requires `doc_id` and `text` headers.
- Export filenames are prefixed with the Study ID.
