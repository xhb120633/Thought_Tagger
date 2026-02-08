# @thought-tagger/exporter-webapp

Generate a static web annotation bundle from compiler `manifest.json` output.

```bash
node packages/exporters/webapp/src/cli.mjs \
  --manifest examples/sentence_labeling/out/manifest.json \
  --out deployment/webapp_bundle
```
