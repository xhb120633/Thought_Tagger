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
