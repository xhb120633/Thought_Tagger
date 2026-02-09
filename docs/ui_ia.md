# Information Architecture — ThoughtTagger Studio + Annotator Workspace

## Studio IA

Studio is organized as a 9-step guided flow with persistent sidebar navigation.

1. **Create Study**
   - Study name/ID
   - Description
2. **Upload Dataset**
   - File upload or paste
   - Validation panel
   - Data preview table
3. **Choose Task Type**
   - `label` / `annotate` / `compare`
4. **Choose Unitization**
   - `document` / `sentence_step` / `target_span`
5. **Build Rubric**
   - Label cards with stable ID, name, definition, examples
6. **Write Instructions**
   - Global instructions
   - Task-specific notes
7. **Run Mode**
   - Participant vs RA
   - Save policy selector
8. **Work Plan**
   - Annotator list
   - Replication `k`
   - Optional group count `G`
9. **Review & Export**
   - Study summary metrics
   - Warnings
   - Export bundle
   - Preview as Annotator

### Sidebar behavior

- Each step shows status: `Not started`, `In progress`, `Complete`, `Blocked`.
- Clicking a step jumps to that section.
- Current step is highlighted.
- Autosave status shown in header.

## Workspace IA

Workspace is a two-pane productivity layout.

### Left region: Context Panel

- Full document text (scrollable)
- Active unit highlight (sentence mode)
- Span selection area (target span mode)
- Existing highlights with badges

### Right region: Action Panel

- Progress + doc/unit metadata
- Rubric palette
- Task-specific controls:
  - Label mode: choose label per unit
  - Annotate mode: notes/annotation entry + apply label
  - Compare mode: side-by-side candidate cards + decision panel
- Undo/redo + next/prev controls
- Save state indicator

### Auxiliary regions

- Collapsible unit jump list (sentence mode)
- Tagged span chips (target span mode)
- Keyboard shortcut hints

## Route map

Single-page app with internal view state (no heavy router required for v1):

- `/` → Studio shell + step content
- `/?preview=annotator` (state-driven panel/modal) → embedded annotator preview using draft spec

If route splitting is later adopted:

- `/studio/create`
- `/studio/dataset`
- `/studio/task`
- `/studio/unitization`
- `/studio/rubric`
- `/studio/instructions`
- `/studio/run-mode`
- `/studio/work-plan`
- `/studio/review`
- `/preview/annotator`
