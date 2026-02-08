# Release Policy

This project follows semantic versioning and a lightweight release governance model.

## Versioning model

- **MAJOR** (`X.0.0`): breaking schema/output contract changes.
- **MINOR** (`0.X.0` before 1.0, `1.X.0` after): backward-compatible features.
- **PATCH** (`0.0.X` / `1.0.X`): bug fixes, docs, and non-breaking internal updates.

## Stability goals

- `0.1.x` is MVP/pre-1.0 and may change quickly.
- `1.0.0` marks stable baseline contracts for:
  - spec parsing/validation behavior,
  - output artifact structure,
  - documented deployment workflows.

## Release checklist

1. `npm run check:all` passes on CI.
2. Dependency review completed (`npm audit` triage documented).
3. Changelog updated with user-facing changes.
4. Documentation updated for any contract/config changes.
5. Version bumps applied to impacted workspaces.
6. Git tag created for the release commit.

## Changelog policy

- Keep `CHANGELOG.md` in the repository root.
- Organize entries by version and date.
- Group by Added / Changed / Fixed / Docs / Security.

## Branching and tagging

- Main branch remains releasable.
- Release tags use `v<version>` format (for example `v1.0.0`).
- Hotfixes should target a patch release branch and be back-merged.

## Migration notes

Any release with output or schema behavior changes must include:
- what changed,
- how to update existing studies/pipelines,
- any compatibility fallbacks or limitations.
