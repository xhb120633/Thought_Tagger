# Walkthrough: Dataset/Questions → Deployed Study → Collected Results

This walkthrough is designed for non-programmer researchers. You can do most study design work in the Studio UI.

## 1) Install and prepare once

```bash
npm install
npm run build
npm run build -w @thought-tagger/studio
```

## 2) Open the Studio UI

```bash
npm run dev -w @thought-tagger/studio
```

Open the URL shown in terminal (usually `http://localhost:5173`).

## 3) Design your study using mouse + keyboard

In Studio:

1. Set basic study fields in **StudySpec Configuration**.
2. Create your labeling/evaluation questionnaire in **Rubric Editor**.
3. Provide study text in **Dataset Input** (upload file or paste content).
4. Check expected outputs in **Preview**.
5. Click **Export Compiler Bundle**.

You do not need to manually write JSON files for this standard workflow.

## 4) Generate deployment-ready data files (CLI)

If you exported a Studio bundle, use that output for deployment.

If you are using the included example files instead, run:

```bash
npm run compile -- \
  --spec examples/span_target_word/study.spec.json \
  --dataset examples/span_target_word/dataset.jsonl \
  --out deployment/e2e_workspace/data
```

## 5) Create a deployable workspace

```bash
mkdir -p deployment/e2e_workspace
cp -R apps/studio/dist/. deployment/e2e_workspace/
```

Now you have:

- UI shell in `deployment/e2e_workspace/`
- Study data outputs in `deployment/e2e_workspace/data/`

## 6) Run locally for pilot validation

```bash
npx serve deployment/e2e_workspace -l 4176
```

Open `http://localhost:4176` and run through one full participant/annotator session.

## 7) Verify key generated artifacts

```bash
test -f deployment/e2e_workspace/data/manifest.json
test -f deployment/e2e_workspace/data/units.jsonl
test -f deployment/e2e_workspace/data/annotation_template.csv
test -f deployment/e2e_workspace/data/event_log_template.jsonl
```

## 8) Move to your target deployment

- Local / RA server: `docs/deployment/self_host.md`
- Pavlovia: `docs/deployment/pavlovia.md`
- Prolific: `docs/deployment/prolific.md`

Use local pilot completion as your go/no-go check before external participants.
