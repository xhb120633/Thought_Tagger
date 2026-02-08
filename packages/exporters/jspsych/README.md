# @thought-tagger/exporter-jspsych

Generate a jsPsych-compatible static bundle from compiler `manifest.json` output.

```bash
node packages/exporters/jspsych/src/cli.mjs \
  --manifest examples/cot_step_tagging/out/manifest.json \
  --out deployment/jspsych_bundle
```
