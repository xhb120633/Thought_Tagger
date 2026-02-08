# @thought-tagger/exporter-webapp

Exports compiler outputs into a standalone browser app (`index.html` + `app.js`) for self-hosted annotation.

## Build

```bash
npm run build -w @thought-tagger/exporter-webapp
```

## Run exporter

1. Compile a study:

```bash
npm run build -w @thought-tagger/compiler
node -e "import('@thought-tagger/compiler').then(m=>m.compileStudy({specPath:'examples/sentence_labeling/study.spec.json',datasetPath:'examples/sentence_labeling/dataset.jsonl',outDir:'/tmp/tt-compiled'}))"
```

2. Export a deployable web app bundle:

```bash
node -e "import('@thought-tagger/exporter-webapp').then(m=>m.exportWebappBundle({compilerOutputDir:'/tmp/tt-compiled',outDir:'/tmp/tt-webapp'}))"
```

3. Serve locally:

```bash
npx serve /tmp/tt-webapp
```

Open `http://localhost:3000` (or the URL printed by `serve`). Progress is autosaved to `localStorage`, and exported annotations/event logs follow ThoughtTagger V1 schemas.
