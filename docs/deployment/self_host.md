# Deployment Guide: Local Testing or Personal Server (RA Mode)

This is the simplest deployment path and works for two scenarios:

1. **Local testing/demo** on your own machine.
2. **Personal server (RA mode)** for internal lab annotators.

---

## Step 1 — Build toolkit

```bash
npm run build
```

## Step 2 — Compile study outputs

```bash
npm run compile -- \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

## Step 3 — Create deployable workspace folder

```bash
node packages/exporters/webapp/src/cli.mjs \
  --manifest examples/sentence_labeling/out/manifest.json \
  --out deployment/self_host_workspace
cp examples/sentence_labeling/out/* deployment/self_host_workspace/
```

At this point, `deployment/self_host_workspace/` is what you deploy.

## Step 4A — Local testing/demo run

```bash
npx serve deployment/self_host_workspace -l 4173
```

Open: `http://localhost:4173`

## Step 4B — Personal server (RA mode)

- Copy the contents of `deployment/self_host_workspace/` to your server static web folder.
- Serve with HTTPS.
- Protect access (e.g., VPN, login, IP allow-list).
- Verify data storage/log routing before real annotation starts.

## Step 5 — Pre-launch checks

```bash
test -f deployment/self_host_workspace/manifest.json
test -f deployment/self_host_workspace/units.jsonl
test -f deployment/self_host_workspace/event_log_template.jsonl
node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('deployment/self_host_workspace/manifest.json','utf8')); if(!m.study_id||!m.task_type||!m.unitization_mode){throw new Error('manifest missing required fields')} console.log('manifest OK')"
```

## Researcher checklist (plain language)

Before your first real data collection:
- [ ] I can open the study URL in a browser.
- [ ] A pilot annotation session can be completed end-to-end.
- [ ] Output events/results are being stored where expected.
- [ ] I have a backup plan for collected data.
