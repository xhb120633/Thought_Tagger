# @thought-tagger/exporter-jspsych

Exports compiler outputs into a jsPsych-friendly bundle with a runnable fallback UI and timeline helper.

## Build

```bash
npm run build -w @thought-tagger/exporter-jspsych
```

## Run exporter

```bash
node -e "import('@thought-tagger/exporter-jspsych').then(m=>m.exportJsPsychBundle({compilerOutputDir:'/tmp/tt-compiled',outDir:'/tmp/tt-jspsych'}))"
```

## Smoke run

```bash
npx serve /tmp/tt-jspsych
```

The generated `app.js` exposes `globalThis.ThoughtTaggerApp` including:

- `toJsPsychTimeline()` for jsPsych integration
- `saveProgress()` / `loadProgress()` for resumable sessions
- `exportAnnotationTable()` and `exportEventLog()` for normalized outputs
