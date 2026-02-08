# @thought-tagger/exporter-prolific

Exports compiler outputs into a Prolific-ready annotation app with completion URL generation.

## Build

```bash
npm run build -w @thought-tagger/exporter-prolific
```

## Run exporter

```bash
node -e "import('@thought-tagger/exporter-prolific').then(m=>m.exportProlificBundle({compilerOutputDir:'/tmp/tt-compiled',outDir:'/tmp/tt-prolific',completionCode:'ABC123'}))"
```

## Deploy + verify

```bash
npx serve /tmp/tt-prolific
```

Visit with query params such as:

```text
http://localhost:3000/?PROLIFIC_PID=pid-42&SESSION_ID=session-42
```

The app persists progress in `localStorage`, exports annotation/event files in ThoughtTagger V1 schemas, and computes completion links via `ThoughtTaggerApp.completionUrl()`.
