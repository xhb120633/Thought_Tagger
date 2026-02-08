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

## Save/reload loses progress in deployment smoke tests

1. Verify you are loading the same workspace URL and path after refresh.
2. Preserve query parameters required by your recruitment platform.
3. Confirm your storage/event sink receives writes before navigation.

Quick check command (artifact side):

```bash
test -f deployment/e2e_workspace/data/event_log_template.jsonl
```

## Session resume is assigning the wrong unit set

Validate the assignment manifest before publishing:

```bash
node -e "const fs=require('fs'); const p='deployment/prolific_workspace/data/assignment_manifest.jsonl'; const rows=fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse); const ids=new Set(rows.map(r=>r.assignment_id)); if(ids.size!==rows.length) throw new Error('duplicate assignment_id found'); console.log('assignment IDs unique:', rows.length)"
```

If this fails, re-run compile and republish deployment artifacts.

## Output schema verification before collecting production data

Run schema checks against generated outputs:

```bash
node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('deployment/e2e_workspace/data/manifest.json','utf8')); ['study_id','task_type','unitization_mode','rubric_version'].forEach(k=>{if(!(k in m)) throw new Error('manifest missing '+k)}); console.log('manifest schema ok')"
node -e "const fs=require('fs'); const first=JSON.parse(fs.readFileSync('deployment/e2e_workspace/data/units.jsonl','utf8').trim().split('\n')[0]); ['unit_id','doc_id','unit_text'].forEach(k=>{if(!(k in first)) throw new Error('units missing '+k)}); console.log('units schema ok')"
```

## Studio is not reachable

Run:

```bash
npm run dev -w @thought-tagger/studio
```

Then open the local URL printed by Vite (usually `http://localhost:5173`).
