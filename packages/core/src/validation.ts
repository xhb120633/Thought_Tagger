import { InputDocument, ResponseType, RubricQuestion, StudySpec } from "./types.js";

const TASK_TYPES = new Set(["label", "annotate", "compare"]);
const UNITIZATION_MODES = new Set(["document", "sentence_step", "target_span"]);
const RUN_MODES = new Set(["participant", "ra"]);
const RESPONSE_TYPES = new Set<ResponseType>([
  "single_select",
  "multi_select",
  "free_text",
  "choice",
  "choice_with_rationale"
]);

export function assertValidStudySpec(spec: StudySpec): void {
  if (!spec.study_id.trim()) throw new Error("study_id is required");
  if (!spec.rubric_version.trim()) throw new Error("rubric_version is required");
  if (!TASK_TYPES.has(spec.task_type)) throw new Error(`Unsupported task_type: ${spec.task_type}`);
  if (!UNITIZATION_MODES.has(spec.unitization_mode)) {
    throw new Error(`Unsupported unitization_mode: ${spec.unitization_mode}`);
  }
  if (!RUN_MODES.has(spec.run_mode)) throw new Error(`Unsupported run_mode: ${spec.run_mode}`);
  if (!Array.isArray(spec.questions) || spec.questions.length === 0) {
    throw new Error("questions must be a non-empty array");
  }
  spec.questions.forEach(assertValidQuestion);
}

function assertValidQuestion(question: RubricQuestion, index: number): void {
  if (!question.question_id?.trim()) throw new Error(`Question ${index} missing question_id`);
  if (!question.prompt?.trim()) throw new Error(`Question ${question.question_id} missing prompt`);
  if (!RESPONSE_TYPES.has(question.response_type)) {
    throw new Error(`Unsupported response_type in ${question.question_id}: ${question.response_type}`);
  }

  if (["single_select", "multi_select", "choice", "choice_with_rationale"].includes(question.response_type)) {
    if (!question.options || question.options.length === 0) {
      throw new Error(`Question ${question.question_id} needs non-empty options`);
    }
  }

  if (question.response_type === "free_text" && question.max_chars !== undefined && question.max_chars < 1) {
    throw new Error(`Question ${question.question_id} max_chars must be >= 1`);
  }
}

export function assertValidDocuments(documents: InputDocument[]): void {
  const seenIds = new Set<string>();
  for (const doc of documents) {
    if (!doc.doc_id?.trim()) throw new Error("Every document needs doc_id");
    if (seenIds.has(doc.doc_id)) throw new Error(`Duplicate doc_id detected: ${doc.doc_id}`);
    if (!doc.text?.trim()) throw new Error(`Document ${doc.doc_id} has empty text`);
    seenIds.add(doc.doc_id);
  }
}
