# ThoughtTagger — Design Logics

ThoughtTagger is an open-source, spec-driven annotation system designed for **think-aloud / chain-of-thought (CoT) data**.  
Its core goal is to let researchers focus on **rubrics, instructions, and scientific questions**, while the system handles **task generation, work distribution, and deployment-ready code generation**.

This document summarizes the **design logic**, **scope boundaries**, and a **proposed repository framework**.

---

## 1. Core Philosophy

### 1.1 What ThoughtTagger *is*
- A **tool-like annotation workspace**, not a traditional trial-based experiment
- A **task generator + compiler**, not a hosting platform
- A **unitized, replicable annotation framework** for CoT / TA data

### 1.2 What ThoughtTagger *is not*
- Not a general experiment builder (no arbitrary trial logic)
- Not a deployment service (no hosting, auth, payment, etc.)
- Not a free-form UI playground (interaction primitives are fixed)

---

## 2. Researcher Freedom vs Constraints

### 2.1 What researchers can freely define
- **Rubrics**
  - Label names, definitions, examples, counterexamples
  - Hierarchical label structure
  - Required / optional fields
- **Instructions**
  - Global instructions
  - Task-specific instructions
  - Attention checks (content only)
- **Dataset content**
  - Custom CoT / TA texts
  - Metadata columns for stratification / analysis

### 2.2 What researchers choose from limited options
These choices determine how code is generated.

1. **Task Type**
   - `label` — single / multi-label selection
   - `annotate` — free-text annotation
   - `compare` — A/B or pairwise comparison

2. **Annotation Unit**
   - `document` — whole CoT
   - `sentence / step` — auto-derived units
   - `target_span` — highlight words / phrases (lightweight “target word” mode)

3. **Run Mode**
   - `participant` — fixed, non-resumable session
   - `RA` — assignment-based, resumable, autosaved

4. **Work Distribution**
   - Disjoint partition (each doc to one rater)
   - Replicated labeling (`k` raters per doc)

---

## 3. Data Model: Document-First, Unit-Derived

### 3.1 Input data (researcher uploads)
Researchers upload **full documents only** (not pre-split sentences or words).

Accepted formats:
- `.csv`
- `.jsonl`

Minimal schema:
- `doc_id`
- `text` (full CoT / TA)
- optional `meta.*`

### 3.2 Internal unitization (system-derived)
ThoughtTagger deterministically derives annotation units.

Supported unitization modes:
- `document`
- `sentence / step`
- `target_span` (highlighted spans)

Each derived unit has:
- `doc_id`
- `unit_id`
- `unit_type`
- `index` (for sentence/step)
- `char_start`, `char_end`
- `unit_text`
- `segmentation_version` (method + params hash)

**Principle:**  
Researchers never manage unitization manually; units are derived but always shown **with full document context**.

---

## 4. UI Interaction Paradigm (Tool-Like, Not Trial-Like)

### 4.1 Core interaction loop

    read context → hover / select → label → visualize → autosave

### 4.2 Key UI properties
- Full document always visible
- Hover highlights sentences / tokens
- Click / drag to select spans
- Apply labels via palette / keyboard
- Labeled spans rendered with background colors
- Tooltips show labels and metadata
- Undo / redo supported

### 4.3 Participant vs RA difference
Same UI, different policies:
- Navigation (linear vs free)
- Persistence (end-only vs autosave)
- Identity (anonymous vs account / invite)

---

## 5. Task Types (Fixed Interaction Primitives)

### T1. Label
- Single-label or multi-label
- Optional confidence / rationale
- Works at document, sentence, or span level

### T2. Annotate
- Free-text annotation
- Typically document or sentence level

### T3. Compare
- Two alternatives (A/B)
- Optional tie / rationale
- Used for CoT quality, faithfulness, preference

Each task type compiles to a **fixed UI skeleton** and **fixed logging schema**.

---

## 6. Target Word = Constrained Span Annotation

“Target word” is implemented as:
- `target_span` with constraints (e.g., max 1 token)
- Human-driven highlighting (no automatic word detection)
- Deterministic snapping to token / character boundaries

Variants:
- **Select-only**: highlight words satisfying rubric
- **Select + label**: highlight + categorize

Stored as:
- `char_start`, `char_end`
- `selected_text`
- `labels` (optional)

---

## 7. Replication & Work Distribution (Non-Cloning)

### 7.1 Definition of replication
Replication means **different raters labeling the same content under the same rubric**.

For CoT data:
- **Assignment unit:** document
- **Annotation unit:** sentence / span
- Replication at document level implies replication for all its sentences

Example:
- 1 doc, 20 sentences, `k = 5`
- 5 raters × same document
- Output: 100 sentence-level judgments

### 7.2 Work plan abstraction
Researchers define a **work plan**, not multiple jobs.

Components:
- Partitioning (optional)
- Replication factor `k`
- Assignment strategy
- Balancing / stratification

### 7.3 Assignment manifest (generated)
Instead of cloning studies, ThoughtTagger generates:

`assignments.csv`
- `assignment_id`
- `annotator_id`
- `doc_id`
- `replicate_idx`
- `status`
- `condition_id`

Constraint:
- Same `doc_id` must be assigned to **distinct raters** across replications.

### 7.4 Output remains unit-level
Annotations are always stored at:

    (doc_id, unit_id, annotator_id)

---

## 8. A/B Testing as Assignment Policy

A/B tests are implemented as **assignment policies**, not new task types.

Scopes:
- Between raters (default)
- Between documents
- Between units (advanced)

Condition assignment is deterministic and logged per annotation.

---

## 9. Outputs (Standardized, Analysis-Ready)

### 9.1 Annotation table
One row per judgment:
- `study_id`
- `rubric_version`
- `annotator_id`
- `doc_id`, `unit_id`
- `task_type`
- `labels / text / choice`
- `confidence`, `rationale`
- `condition_id`
- timestamps

### 9.2 Event log
Append-only interaction log:
- selections
- edits
- navigation
- timing

**Principle:**  
Never CSV-only without provenance.

---

## 10. Deployment Philosophy

- ThoughtTagger **generates code**, it does not deploy
- Generated bundles are **deployment-ready**

Supported targets:
- Self-hosted web app (RA take-home)
- jsPsych / Pavlovia bundle
- Prolific-compatible redirect flow

Each export comes with **first-level deployment guides**.

---

## 11. Proposed Repository Framework

```
ThoughtTagger/
├─ packages/
│  ├─ core/                 # spec schemas, unitization, logging contracts
│  ├─ compiler/             # CLI + build logic
│  ├─ workplan/             # partition, replication, assignment expansion
│  ├─ exporters/
│  │   ├─ webapp/           # deployment-ready web workspace template
│  │   ├─ jspsych/          # Pavlovia-compatible generator
│  │   └─ prolific/         # completion + redirect helpers
│
├─ apps/
│  └─ studio/               # researcher UI (upload → configure → export)
│
├─ examples/
│  ├─ sentence_labeling/
│  ├─ cot_step_tagging/
│  ├─ span_target_word/
│  └─ ab_compare_cot/
│
├─ docs/
│  ├─ design_logics.md
│  ├─ spec_reference.md
│  ├─ deployment/
│  │   ├─ self_host.md
│  │   ├─ pavlovia.md
│  │   └─ prolific.md
│
└─ README.md
```

---

## 12. Design Invariant (One Sentence)

**ThoughtTagger standardizes *how* annotation is executed, not *what* is being studied — enabling scalable, replicable, and analyzable CoT annotation without job cloning or bespoke UI engineering.**

---

## 13. V1 Baseline Decisions (Captured)

Based on product clarification, V1 includes:
- All task types: `label`, `annotate`, `compare`
- All unitization modes: `document`, `sentence / step`, `target_span`
- Both run modes: `participant` and `RA`

Deferred as placeholders for later iteration:
- Replication/work-distribution implementation depth
- Conditional question flows
- Shared context mode for compare

See `docs/spec_reference.md` for the implementable baseline specification.
