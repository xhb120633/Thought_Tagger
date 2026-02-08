# Self-host Deployment (Web Workspace)

This guide exports a study and serves a static, deployment-ready workspace for self-hosted environments.

## 1) Build the compiler and exporter packages

```bash
npm run build
```

## 2) Compile a study into deployable artifacts

```bash
npm run compile -- \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

Artifacts are generated in `examples/sentence_labeling/out/`.

## 3) Export a self-host bundle

```bash
node packages/exporters/webapp/src/cli.mjs \
  --manifest examples/sentence_labeling/out/manifest.json \
  --out deployment/self_host_workspace
cp examples/sentence_labeling/out/* deployment/self_host_workspace/
```

## 4) Serve locally (same command you can use in production smoke tests)

```bash
npx serve deployment/self_host_workspace -l 4173
```

Then open `http://localhost:4173` and verify the app loads.

## 5) Validate outputs before publishing

```bash
node -e "const fs=require('fs'); const p='deployment/self_host_workspace/manifest.json'; const m=JSON.parse(fs.readFileSync(p,'utf8')); if(!m.study_id||!m.task_type||!m.unitization_mode){throw new Error('manifest missing required fields')} console.log('manifest ok:',m.study_id,m.task_type,m.unitization_mode)"
node -e "const fs=require('fs'); const p='deployment/self_host_workspace/units.jsonl'; const c=fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).length; if(c===0){throw new Error('units.jsonl is empty')} console.log('units rows:',c)"
```

## Notes

- `npx serve` installs/uses `serve` on demand and is suitable for local validation.
- For production, copy `deployment/self_host_workspace/` behind your preferred static host/CDN.
