# Troubleshooting

## `node --test dist/test/*.test.js` cannot find files

Run build before tests:

```bash
npm run build
npm test
```

## Compiler errors about invalid study specs

Validate fields in `study.spec.json`:

- `study_id`
- `rubric_version`
- `task_type`
- `unitization_mode`
- `run_mode`

For workplans, ensure `replication_factor <= annotator_ids.length`.

## CSV import failed

- Ensure CSV header includes `doc_id,text`
- Escape embedded quotes with doubled quotes (`""`)

## Studio is not reachable

Run:

```bash
npm run dev -w @thought-tagger/studio
```

Then open the local URL printed by Vite (usually `http://localhost:5173`).
