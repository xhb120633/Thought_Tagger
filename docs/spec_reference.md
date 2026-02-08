# ThoughtTagger Spec Reference (V1 Baseline)

This document converts the design logics into an implementable baseline spec for V1.

## 1. Scope Decisions Confirmed for V1

### 1.1 Included task types
- `label`
- `annotate`
- `compare`

### 1.2 Included unitization modes
- `document`
- `sentence_step`
- `target_span`

### 1.3 Included run modes
- `participant`
- `ra`

### 1.4 Deferred to placeholders
- Replication strategy implementation details
- Work-distribution optimization details
- Shared context mode for compare tasks

These deferred items are tracked for post-1.0 planning in `docs/post_1_0_roadmap.md`.

---

## 2. Dataset Inputs

## 2.1 Accepted formats
- CSV
- JSONL

## 2.2 Common required fields
- `doc_id` (string; unique within a study upload)
- `text` (string; full document content)
- optional metadata fields prefixed by `meta.`

## 2.3 Compare mode input behavior
Researchers may upload one or more files:
- **Single-file compare**: self-comparison mode. Pairs are generated within the same source file according to pairing policy.
- **Two-file compare**: A/B-style mode. One candidate is drawn from file A and one from file B.

V1 pairing policies (configurable):
- `by_index`: pair entries by order (`i` in A with `i` in B)
- `random_pair`: random pairing based on deterministic seed

Presentation randomization:
- A/B side ordering can be randomized while preserving logged source identity.

Placeholder (not implemented in V1):
- Shared context sidecar file that injects aligned context for each comparison pair.

Roadmap tracking: `docs/post_1_0_roadmap.md`.

---

## 3. Rubric / Question Model

A rubric is represented as a list of questions with task-type-specific answer configs.

## 3.1 Shared fields
Each question:
- `question_id`
- `prompt`
- `required` (boolean)
- `help_text` (optional)

## 3.2 Label task question
- `response_type`: `single_select` or `multi_select`
- `options`: list of `{ value, label, description? }`
- `min_select` / `max_select` constraints

## 3.3 Annotate task question
- `response_type`: `free_text`
- `max_chars` (optional)
- `placeholder` (optional)

## 3.4 Compare task question
- `response_type`: `choice` or `choice_with_rationale`
- built-in options may include `A`, `B`, optionally `tie`
- rationale can be optional or required

Conditional branching support is available through per-question `show_if` rules (see example below).

Example:
```json
{
  "question_id": "q2",
  "show_if": { "question_id": "q1", "equals": "unclear" }
}
```

---

## 4. Unitization Rules

## 4.1 Document mode
- One derived unit per document.

## 4.2 Sentence/step mode
- Use common deterministic sentence splitting strategy suitable for general text.
- V1 default: regex/rule-based segmentation with stable behavior and no external model requirement.
- Each unit stores:
  - `unit_id`
  - `unit_type = sentence_step`
  - `index`
  - `char_start`
  - `char_end`
  - `unit_text`
  - `segmentation_version`

## 4.3 Target span mode
- User highlights spans manually.
- Span snapping is deterministic at character boundaries in V1.

---

## 5. Run Mode Behavior

## 5.1 RA mode
- Autosave enabled.
- Sessions resumable.
- Assignment-based progression.

## 5.2 Participant mode
- Designed like psychological task sessions.
- Non-resumable once submitted/exited according to study policy.
- Simpler linear progression default.

---

## 6. Outputs (V1 Contract Targets)

## 6.1 Annotation table (normalized)
Target columns:
- `study_id`
- `rubric_version`
- `annotator_id`
- `doc_id`
- `unit_id`
- `task_type`
- `response_payload`
- `confidence` (optional)
- `rationale` (optional)
- `condition_id` (optional)
- `created_at`
- `updated_at`

## 6.2 Event log (append-only)
- `event_id`
- `timestamp`
- `actor_id`
- `doc_id`
- `unit_id` (nullable)
- `event_type`
- `event_payload`

---

## 7. Researcher UX Principles for V1

- Minimize configuration burden while preserving scientific control.
- Present defaults with explicit advanced toggles.
- Keep terminology consistent with annotation workflows.
- Validate early: upload schema, rubric consistency, and export readiness.

## 8. Annotator UX Principles for V1

- Keep the full context visible where possible.
- Make required actions obvious and keyboard-friendly.
- Reduce ambiguity in question wording and option labels.
- Preserve progress safely (autosave in RA mode).
