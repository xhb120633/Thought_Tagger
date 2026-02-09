# UI Audit — ThoughtTagger Studio + Annotator Workspace

## Current screens (as-is)

1. Single `App` page that mixes all setup concerns in one surface.
2. StudySpec form block (study metadata, task type, unitization, run mode, workplan basics).
3. Dataset text area + upload.
4. Rubric raw JSON editor.
5. Compile preview + export button.
6. Minimal RA draft resume/discard prompt.

## Missing flows against target UX

1. No guided multi-step onboarding for new researchers.
2. No explicit dataset validation report (required fields, duplicates, empty rows, long text warnings).
3. No rubric builder UI (only raw JSON editing).
4. No instructions editor (global + task-specific).
5. No explicit run-mode/save policy surface.
6. No work-plan planning UI beyond comma-separated annotators + replication number.
7. No review page with derived workload metrics.
8. No preview-as-annotator experience.
9. No dedicated annotator workspace layout with context/action split.
10. No compare-task side-by-side decision UI.

## Top 10 UX problems

1. **Single dense form** creates high cognitive load and poor discoverability.
2. **Raw JSON rubric dependency** blocks non-technical users.
3. **No progress model** (users cannot tell what is done/remaining).
4. **Validation errors are global and late** instead of contextual and actionable.
5. **Dataset quality issues are invisible** until compile fails.
6. **No autosave affordance for most work** (only rubric and RA draft special-cased).
7. **No “saved” confidence signal** for long setup sessions.
8. **No study summary before export** (hard to review mistakes).
9. **No annotation preview** means researchers cannot test usability early.
10. **No keyboard-assisted navigation** for annotator throughput.

## Top 10 visual design problems

1. Minimal default HTML controls with inconsistent spacing.
2. No design token system for color/typography/spacing.
3. Weak hierarchy (headings and form fields visually blend).
4. No step/sidebar navigation frame.
5. Status/error messages are visually plain and easy to miss.
6. No card-based separation of conceptual sections.
7. Limited use of affordances (chips/badges/indicators).
8. No visual distinction of primary vs secondary actions.
9. Text areas dominate and reduce scanability.
10. Annotator-like interactions (selection/highlight/feedback) absent.

## Reusable component opportunities

Shared components that should work across Studio + Workspace:

1. App shell with sidebar and status badges.
2. Card container component with title/meta/actions.
3. Form field primitives (label, help text, error text, input/select/textarea).
4. Pill/chip component for labels, units, and validation states.
5. Button variants (primary, secondary, ghost, danger).
6. Alert/banner component for error/warning/success.
7. Progress indicator component.
8. Keyboard shortcut hint badges.
9. Empty states for optional data.
10. Sticky action footer/header section.
