# Studio Guide Panel (Global Onboarding)

## Purpose
The Studio Guide Panel is **global onboarding UI** shown at the top of ThoughtTagger Studio.
It helps researchers start correctly by explaining:

- ThoughtTagger's spec-driven mental model.
- Dataset requirements (`.jsonl` / `.csv`, required `doc_id` and `text`, `meta.*` metadata pattern).
- Task + unitization consequences.
- Replication/work-plan semantics.

## Non-goal (separation of concerns)
The guide is **not study configuration** and must never be exported.

- It is not serialized into `StudySpec`.
- It is not included in generated artifact bundles.
- It is not persisted in study draft state.

Only guide visibility preference is persisted (`thoughttagger:studioGuideCollapsed`) so users can hide/show onboarding.

## UX behavior
- Visible by default for first-time users.
- "Don't show again" hides it by default in future sessions.
- A persistent `Guide` button in the header always re-opens it.
- Supports progressive disclosure with accessible collapsible sections.

## Content ownership
Design/process documentation belongs in `docs/`.
Application screens should remain focused on interactive product workflows, not long-form audit/process writeups.
