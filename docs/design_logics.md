# ThoughtTagger Design Logics

This file mirrors the conceptual design from the repository README and exists as the canonical docs location for design principles.

For the full narrative and rationale, see `README.md`.

## Design invariant

ThoughtTagger standardizes **how annotation is executed**, not **what is being studied**, so CoT/think-aloud annotation can scale with reproducibility and analysis-ready outputs.

## Product boundaries

- Tool-like annotation workspace, not a free-form experiment builder.
- Spec/compiler-oriented system, not a hosting platform.
- Fixed interaction primitives with flexible rubric content.
