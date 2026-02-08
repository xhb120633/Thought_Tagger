# Quickstart for Psychology Researchers (10–20 minutes)

This guide assumes minimal coding experience.

## What you need

- A study spec file (`study.spec.json`) — describes your task setup.
- A dataset file (`.jsonl` or `.csv`) — contains your source texts.
- Node.js 20+ installed.

If you are unsure, start with included examples in `examples/`.

## Step 1 — Install once

```bash
npm install
```

## Step 2 — Build once per update

```bash
npm run build
```

## Step 3 — Compile your study files

```bash
npm run compile -- \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

You should get:
- `manifest.json`
- `units.jsonl`
- `annotation_template.csv`
- `event_log_template.jsonl`
- `assignment_manifest.jsonl` (if workplan is configured)

## Step 4 — Choose deployment mode

### Option A: Local testing/demo (recommended first)
Use this to pilot with your team or class.

Follow: `docs/deployment/self_host.md`

### Option B: Personal server (RA mode)
Use this for internal lab annotation with research assistants.

Follow: `docs/deployment/self_host.md` and host resulting folder on your lab server.

### Option C: Participant platform (Pavlovia/Prolific)
Use this for participant recruitment studies.

Follow:
- `docs/deployment/pavlovia.md` for Pavlovia
- `docs/deployment/prolific.md` for Prolific

## Step 5 — Optional Studio UI (no-code editing)

```bash
npm run dev -w @thought-tagger/studio
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

Studio helps you:
- Upload/paste dataset text
- Configure spec fields visually
- Export compiler-compatible bundle files

## If something fails

Go to: `docs/troubleshooting.md`
