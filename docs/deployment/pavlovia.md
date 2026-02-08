# Pavlovia Deployment (jsPsych-Compatible Package)

This guide prepares artifacts and a static package that can be uploaded into a Pavlovia-style/jsPsych hosting workflow.

## 1) Build required packages

```bash
npm run build
npm run build -w @thought-tagger/studio
```

## 2) Compile your study

```bash
npm run compile -- \
  --spec examples/cot_step_tagging/study.spec.json \
  --dataset examples/cot_step_tagging/dataset.jsonl \
  --out examples/cot_step_tagging/out
```

## 3) Assemble a Pavlovia upload directory

```bash
rm -rf deployment/pavlovia_package
mkdir -p deployment/pavlovia_package/data
cp -R apps/studio/dist/. deployment/pavlovia_package/
cp examples/cot_step_tagging/out/* deployment/pavlovia_package/data/
```

## 4) Verify package integrity

```bash
test -f deployment/pavlovia_package/index.html
test -f deployment/pavlovia_package/data/manifest.json
test -f deployment/pavlovia_package/data/units.jsonl
test -f deployment/pavlovia_package/data/event_log_template.jsonl
```

## 5) (Optional) Local pre-upload smoke test

```bash
npx serve deployment/pavlovia_package -l 4174
```

Open `http://localhost:4174` and confirm the study UI renders.

## 6) Upload steps

1. Create a new project on Pavlovia.
2. Upload the contents of `deployment/pavlovia_package/`.
3. Ensure `index.html` is the launch file.
4. Start a pilot run and confirm events are produced against your expected logging pipeline.
