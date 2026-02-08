# Deployment Guide: Prolific (Participant Recruitment)

Use this when recruiting participants through Prolific.

## Step 1 — Build toolkit

```bash
npm run build
```

## Step 2 — Compile study outputs

```bash
npm run compile -- \
  --spec examples/ab_compare_cot/study.spec.json \
  --dataset examples/ab_compare_cot/dataset.csv \
  --out examples/ab_compare_cot/out
```

## Step 3 — Generate Prolific-ready package

```bash
node packages/exporters/prolific/src/cli.mjs \
  --manifest examples/ab_compare_cot/out/manifest.json \
  --out deployment/prolific_workspace \
  --completion-code ABC123
cp examples/ab_compare_cot/out/* deployment/prolific_workspace/
```

Replace `ABC123` with your real completion code.

## Step 4 — Validate required files

```bash
test -f deployment/prolific_workspace/assignment_manifest.jsonl
test -f deployment/prolific_workspace/event_log_template.jsonl
node -e "const fs=require('fs'); const rows=fs.readFileSync('deployment/prolific_workspace/assignment_manifest.jsonl','utf8').trim().split('\n').filter(Boolean); if(!rows.length) throw new Error('No assignments found'); const first=JSON.parse(rows[0]); if(!first.assignment_id||!first.annotator_id) throw new Error('Missing assignment fields'); console.log('assignment manifest OK')"
```

## Step 5 — Optional local smoke test

```bash
npx serve deployment/prolific_workspace -l 4175
```

Open: `http://localhost:4175`

## Step 6 — Connect with Prolific

- Use your hosted study URL in Prolific.
- Preserve query params (`PROLIFIC_PID`, `STUDY_ID`, `SESSION_ID`).
- Redirect participants to the Prolific completion URL when finished.

## Researcher checklist

- [ ] Completion code is correct.
- [ ] Participant IDs/session IDs are preserved.
- [ ] Pilot participants can finish and be redirected successfully.
