# ThoughtTagger — Research Annotation Toolkit

ThoughtTagger helps psychology researchers design labeling/evaluation studies (including questionnaire-style rubric prompts) and turn them into annotation-ready study files.

## Current project status (March 2026)

ThoughtTagger is in a **researcher-ready release candidate** state:

- ✅ Core compile/export pipeline is stable and tested.
- ✅ Three deployment paths exist today: local demo, personal server (RA mode), and participant platforms (Pavlovia/Prolific).
- ✅ Deterministic assignment/workplan features are implemented.
- ⚠️ Deployment operations (auth, backups, monitoring, secure hosting) are still your lab/institution responsibility.

See:
- [Production readiness](docs/production_readiness.md)
- [Active roadmap](docs/post_1_0_roadmap.md)

## Fast start

```bash
npm install
npm run build
npm run compile -- \
  --spec examples/sentence_labeling/study.spec.json \
  --dataset examples/sentence_labeling/dataset.jsonl \
  --out examples/sentence_labeling/out
```

## Pick a deployment path

1. **Local (testing/demo):** run on your laptop for piloting and method demos.  
   → [Local deployment quick path](docs/deployment/self_host.md)
2. **Personal server (RA mode):** host on your own server for trained research assistants.  
   → [Personal server deployment](docs/deployment/self_host.md)
3. **Participant platform (Pavlovia/Prolific):** package for external participants and recruitment workflows.  
   → [Pavlovia guide](docs/deployment/pavlovia.md), [Prolific guide](docs/deployment/prolific.md)

## Documentation index

### Start here (non-technical)
- [Terminal basics (open terminal + use `cd` step-by-step)](docs/terminal_basics.md)
- [Researcher quickstart (explains npm/Terminal + UI-first workflow)](docs/quickstart.md)
- [Installation guide (beginner-friendly)](docs/installation.md)
- [Study workflow: dataset → deployment → results](docs/workflow_dataset_to_results.md)

### Study design and specs
- [Spec reference](docs/spec_reference.md)
- [Design logics](docs/design_logics.md)

### Deployment
- [Self-host / local / personal server](docs/deployment/self_host.md)
- [Pavlovia deployment](docs/deployment/pavlovia.md)
- [Prolific deployment](docs/deployment/prolific.md)

### Readiness and operations
- [Production readiness](docs/production_readiness.md)
- [Active roadmap](docs/post_1_0_roadmap.md)
- [Release policy](docs/release_policy.md)
- [Security & compliance baseline](docs/security_compliance.md)
- [Operations runbook](docs/operations_runbook.md)
- [Environment matrix](docs/environment_matrix.md)
- [Dependency audit process](docs/dependency_audit.md)

### Troubleshooting
- [Troubleshooting guide](docs/troubleshooting.md)

## Useful commands

```bash
npm run build
npm test
npm run build -w @thought-tagger/studio
npm run validate:examples
npm run smoke:exporters
npm run check:all
npm run preflight:release
```
