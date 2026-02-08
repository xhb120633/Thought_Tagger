# Deployment Guide: Pavlovia (Participant Studies)

Use this when you want participants to run your study through a Pavlovia/jsPsych-style hosting flow.

## Step 1 — Build toolkit

```bash
npm run build
```

## Step 2 — Compile study outputs

```bash
npm run compile -- \
  --spec examples/cot_step_tagging/study.spec.json \
  --dataset examples/cot_step_tagging/dataset.jsonl \
  --out examples/cot_step_tagging/out
```

## Step 3 — Generate Pavlovia upload package

```bash
node packages/exporters/jspsych/src/cli.mjs \
  --manifest examples/cot_step_tagging/out/manifest.json \
  --out deployment/pavlovia_package
cp examples/cot_step_tagging/out/* deployment/pavlovia_package/
```

## Step 4 — Validate package files

```bash
test -f deployment/pavlovia_package/index.html
test -f deployment/pavlovia_package/manifest.json
test -f deployment/pavlovia_package/units.jsonl
test -f deployment/pavlovia_package/event_log_template.jsonl
```

## Step 5 — Optional local smoke test

```bash
npx serve deployment/pavlovia_package -l 4174
```

Open: `http://localhost:4174`

## Step 6 — Upload to Pavlovia

1. Create a project on Pavlovia.
2. Upload everything inside `deployment/pavlovia_package/`.
3. Set `index.html` as the entry file.
4. Run a pilot with 1–2 users before full launch.

## Researcher checklist

- [ ] Pilot run completes without broken pages.
- [ ] Expected study events are captured.
- [ ] I documented where participant data is stored.
