# Walkthrough: Raw Dataset → Deployed Workspace → Collected Results

This walkthrough requires **no code edits**. It uses existing scripts and examples in the repository.

## 1) Install and build

```bash
npm install
npm run build
npm run build -w @thought-tagger/studio
```

## 2) Start from a raw dataset + spec

Use the included example as a stand-in for your raw dataset:

- Spec: `examples/span_target_word/study.spec.json`
- Dataset: `examples/span_target_word/dataset.jsonl`

Compile:

```bash
npm run compile -- \
  --spec examples/span_target_word/study.spec.json \
  --dataset examples/span_target_word/dataset.jsonl \
  --out deployment/e2e_workspace/data
```

## 3) Create a deployable workspace

```bash
mkdir -p deployment/e2e_workspace
cp -R apps/studio/dist/. deployment/e2e_workspace/
```

You now have:

- App shell in `deployment/e2e_workspace/`
- Study outputs in `deployment/e2e_workspace/data/`

## 4) Run the deployed workspace locally

```bash
npx serve deployment/e2e_workspace -l 4176
```

Open `http://localhost:4176` and run through a participant session.

## 5) Collect and verify resulting artifacts

The compiler-generated artifacts define the schemas expected for collection:

```bash
test -f deployment/e2e_workspace/data/manifest.json
test -f deployment/e2e_workspace/data/units.jsonl
test -f deployment/e2e_workspace/data/annotation_template.csv
test -f deployment/e2e_workspace/data/event_log_template.jsonl
```

Quick schema checks:

```bash
node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('deployment/e2e_workspace/data/manifest.json','utf8')); ['study_id','task_type','unitization_mode','rubric_version'].forEach(k=>{if(!(k in m)) throw new Error('manifest missing '+k)}); console.log('manifest keys ok')"
node -e "const fs=require('fs'); const row=JSON.parse(fs.readFileSync('deployment/e2e_workspace/data/units.jsonl','utf8').trim().split('\n')[0]); ['unit_id','doc_id','unit_text'].forEach(k=>{if(!(k in row)) throw new Error('units row missing '+k)}); console.log('units schema sample ok')"
```

## 6) Save/reload + session resume drill

1. During a run, copy the active browser URL (including query params).
2. Reload the page.
3. Reopen the copied URL in a new tab/window.
4. Confirm your session identifiers are still present and map to the same assignment/session context.
5. Continue annotation and verify the resulting output still conforms to your expected templates.

Use this when validating production deployments or reverse-proxy changes.
