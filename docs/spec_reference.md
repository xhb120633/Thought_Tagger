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
- None (all prior post-1.0 placeholders in roadmap are implemented).

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
Compare studies must define `compare_pairing` in the study spec:
- `mode`: `single_file` or `two_file`
- `policy`: `by_index` or `random_pair`
- optional `seed` (used for `random_pair`; defaults to `study_id`)

Dataset rules by mode:
- **Single-file compare** (`mode=single_file`): supply only `--dataset`; rows are paired in twos. Requires an even row count.
- **Two-file compare** (`mode=two_file`): supply `--dataset` and `--dataset-b`; one candidate is drawn from each file. Requires equal row counts.

Pairing policies:
- `by_index`: deterministic order pairing
- `random_pair`: deterministic shuffle-based pairing using `seed`

Compiler output normalizes generated compare pairs by assigning:
- `pair_id` (`pair_1`, `pair_2`, ...)
- per-side slots (`A`/`B`) in unit metadata

Shared context support:
- `compare_context.mode = inline_meta`: reads context from a metadata key (for example `meta.shared_context`).
- `compare_context.mode = sidecar`: loads aligned context from JSONL sidecar by generated `pair_id`.

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


## 5.3 Workplan assignment strategies
- `round_robin` (default): rotate annotators by unit index; deterministic and simple.
- `load_balanced`: deterministic least-loaded assignment with stable hash tie-breaking per `assignment_seed`.
- `weighted`: deterministic weighted balancing using `assignment_weights`.
- `stratified_round_robin`: round-robin rotation independently within each stratum defined by `stratify_by_meta_key`.

Common workplan fields:
- `annotator_ids` (required)
- `replication_factor` (optional, defaults to `1`)
- `assignment_strategy` (optional, defaults to `round_robin`)
- `assignment_seed` (optional, used by `load_balanced` and `weighted`; defaults to `thought-tagger-v1`)
- `assignment_weights` (required for `weighted`)
- `stratify_by_meta_key` (required for `stratified_round_robin`)

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
