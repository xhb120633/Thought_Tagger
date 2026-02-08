import { InputDocument, StudySpec } from "./types.js";

const TASK_TYPES = new Set(["label", "annotate", "compare"]);
const UNITIZATION_MODES = new Set(["document", "sentence_step", "target_span"]);
const RUN_MODES = new Set(["participant", "ra"]);

export function assertValidStudySpec(spec: StudySpec): void {
  if (!spec.study_id.trim()) throw new Error("study_id is required");
  if (!spec.rubric_version.trim()) throw new Error("rubric_version is required");
  if (!TASK_TYPES.has(spec.task_type)) throw new Error(`Unsupported task_type: ${spec.task_type}`);
  if (!UNITIZATION_MODES.has(spec.unitization_mode)) {
    throw new Error(`Unsupported unitization_mode: ${spec.unitization_mode}`);
  }
  if (!RUN_MODES.has(spec.run_mode)) throw new Error(`Unsupported run_mode: ${spec.run_mode}`);
  if (spec.workplan) {
    if (!Array.isArray(spec.workplan.annotator_ids) || spec.workplan.annotator_ids.length === 0) {
      throw new Error("workplan.annotator_ids must include at least one annotator id");
    }
    const seen = new Set<string>();
    for (const id of spec.workplan.annotator_ids) {
      if (!id.trim()) throw new Error("workplan.annotator_ids cannot include empty values");
      if (seen.has(id)) throw new Error(`Duplicate workplan annotator_id detected: ${id}`);
      seen.add(id);
    }

    if (spec.workplan.replication_factor !== undefined) {
      if (!Number.isInteger(spec.workplan.replication_factor) || spec.workplan.replication_factor < 1) {
        throw new Error("workplan.replication_factor must be an integer >= 1");
      }
      if (spec.workplan.replication_factor > spec.workplan.annotator_ids.length) {
        throw new Error("workplan.replication_factor cannot exceed annotator count");
      }
    }

    if (spec.workplan.assignment_strategy && spec.workplan.assignment_strategy !== "round_robin") {
      throw new Error(`Unsupported workplan.assignment_strategy: ${spec.workplan.assignment_strategy}`);
    }
  }
}

export function assertValidDocuments(documents: InputDocument[]): void {
  const seenIds = new Set<string>();
  for (const doc of documents) {
    if (!doc.doc_id.trim()) throw new Error("Every document needs doc_id");
    if (seenIds.has(doc.doc_id)) throw new Error(`Duplicate doc_id detected: ${doc.doc_id}`);
    if (!doc.text.trim()) throw new Error(`Document ${doc.doc_id} has empty text`);
    seenIds.add(doc.doc_id);
  }
}
