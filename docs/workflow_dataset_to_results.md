# Walkthrough: Dataset/Questions → Deployed Study → Collected Results

This walkthrough is for non-programmer researchers and is UI-first.

## 0) Before starting

- Read `docs/terminal_basics.md` if you are unfamiliar with Terminal.
- Make sure all commands are run inside the `Thought_Tagger` folder.

## 1) Open terminal and go to the repository folder

### Windows

```powershell
cd C:\Users\YourName\Downloads\Thought_Tagger
```

### macOS

```bash
cd /Users/yourname/Downloads/Thought_Tagger
```

### Linux

```bash
cd /home/yourname/Downloads/Thought_Tagger
```

Check:

```bash
pwd
ls
```

## 2) Prepare the app once

```bash
npm install
npm run build
npm run build -w @thought-tagger/studio
```

## 3) Open Studio UI

```bash
npm run dev -w @thought-tagger/studio
```

Open the URL shown in terminal (usually `http://localhost:5173`).

## 4) Design the study in Studio (mouse + keyboard)

1. Fill in study basics under **StudySpec Configuration**.
2. Create your labeling/evaluation questionnaire in **Rubric Editor**.
3. Provide data under **Dataset Input** (file upload or text paste).
4. Check **Preview**.
5. Click **Export Compiler Bundle**.

For common research use, you do not need to hand-write JSON files.

## 5) Generate deployment-ready outputs

If you exported a Studio bundle, use that output for deployment.

If you are using example inputs from this repository:

```bash
npm run compile -- \
  --spec examples/span_target_word/study.spec.json \
  --dataset examples/span_target_word/dataset.jsonl \
  --out deployment/e2e_workspace/data
```

## 6) Create deployable workspace

```bash
mkdir -p deployment/e2e_workspace
cp -R apps/studio/dist/. deployment/e2e_workspace/
```

Now you have:

- UI shell in `deployment/e2e_workspace/`
- Study data outputs in `deployment/e2e_workspace/data/`

## 7) Run locally for pilot validation

```bash
npx serve deployment/e2e_workspace -l 4176
```

Open `http://localhost:4176` and run one full participant/annotator session.

## 8) Verify key output files exist

```bash
test -f deployment/e2e_workspace/data/manifest.json
test -f deployment/e2e_workspace/data/units.jsonl
test -f deployment/e2e_workspace/data/annotation_template.csv
test -f deployment/e2e_workspace/data/event_log_template.jsonl
```

## 9) Move to your deployment target

- Local / RA server: `docs/deployment/self_host.md`
- Pavlovia: `docs/deployment/pavlovia.md`
- Prolific: `docs/deployment/prolific.md`

Use successful local pilot completion as your go/no-go check before external participants.
