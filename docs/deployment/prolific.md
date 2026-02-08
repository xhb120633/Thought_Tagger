# Prolific Deployment (Completion + Redirect Workflow)

This guide packages a deployable workspace and validates fields commonly needed by Prolific studies.

## 1) Build packages

```bash
npm run build
npm run build -w @thought-tagger/studio
```

## 2) Compile a dataset for deployment

```bash
npm run compile -- \
  --spec examples/ab_compare_cot/study.spec.json \
  --dataset examples/ab_compare_cot/dataset.csv \
  --out examples/ab_compare_cot/out
```

## 3) Build deployment directory

```bash
rm -rf deployment/prolific_workspace
mkdir -p deployment/prolific_workspace/data
cp -R apps/studio/dist/. deployment/prolific_workspace/
cp examples/ab_compare_cot/out/* deployment/prolific_workspace/data/
```

## 4) Validate assignment + event templates (session tracking support)

```bash
test -f deployment/prolific_workspace/data/assignment_manifest.jsonl
test -f deployment/prolific_workspace/data/event_log_template.jsonl
node -e "const fs=require('fs'); const p='deployment/prolific_workspace/data/assignment_manifest.jsonl'; const rows=fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean); if(!rows.length) throw new Error('assignment_manifest.jsonl has no rows'); const first=JSON.parse(rows[0]); if(!first.assignment_id||!first.annotator_id){throw new Error('assignment row missing IDs')} console.log('assignment row ok:', first.assignment_id, first.annotator_id)"
```

## 5) Local validation run

```bash
npx serve deployment/prolific_workspace -l 4175
```

Open `http://localhost:4175` and complete a dry-run session.

## 6) Prolific integration checklist

- Configure your Prolific study URL to point to your hosted workspace URL.
- Preserve query params (`PROLIFIC_PID`, `STUDY_ID`, `SESSION_ID`) through participant flow.
- At completion, redirect participants to your Prolific completion URL with a valid completion code.
- Store generated event logs and assignment-level outputs for auditing.
