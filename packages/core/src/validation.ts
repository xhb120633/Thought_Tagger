import { InputDocument, RubricQuestion, StudySpec, TaskType } from "./types.js";

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

  if (spec.questions) {
    assertValidQuestions(spec.task_type, spec.questions);
  }

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

    if (spec.workplan.assignment_strategy && !["round_robin", "load_balanced"].includes(spec.workplan.assignment_strategy)) {
      throw new Error(`Unsupported workplan.assignment_strategy: ${spec.workplan.assignment_strategy}`);
    }

    if (spec.workplan.assignment_seed !== undefined && !spec.workplan.assignment_seed.trim()) {
      throw new Error("workplan.assignment_seed cannot be empty when provided");
    }
  }
}

function assertValidQuestions(taskType: TaskType, questions: RubricQuestion[]): void {
  const seenIds = new Set<string>();
  const priorQuestions = new Map<string, RubricQuestion>();

  for (const question of questions) {
    if (!question.question_id.trim()) throw new Error("questions[].question_id is required");
    if (seenIds.has(question.question_id)) throw new Error(`Duplicate question_id detected: ${question.question_id}`);
    if (!question.prompt.trim()) throw new Error(`Question ${question.question_id} requires a non-empty prompt`);

    assertValidQuestionByTaskType(taskType, question);

    if (question.show_if) {
      const parent = priorQuestions.get(question.show_if.question_id);
      if (!parent) {
        throw new Error(
          `Question ${question.question_id} show_if references unknown or non-prior question_id: ${question.show_if.question_id}`
        );
      }
      if (!question.show_if.equals.trim()) {
        throw new Error(`Question ${question.question_id} show_if.equals must be non-empty`);
      }

      const parentOptions = getDiscreteAnswerValues(parent);
      if (!parentOptions.has(question.show_if.equals)) {
        throw new Error(
          `Question ${question.question_id} show_if.equals must match one of parent options: ${question.show_if.equals}`
        );
      }
    }

    priorQuestions.set(question.question_id, question);
    seenIds.add(question.question_id);
  }
}

function assertValidQuestionByTaskType(taskType: TaskType, question: RubricQuestion): void {
  if (taskType === "label") {
    if (question.response_type !== "single_select" && question.response_type !== "multi_select") {
      throw new Error(`Question ${question.question_id} has invalid response_type for label task`);
    }
    assertHasValidOptions(question);
    if (question.response_type === "multi_select") {
      if (question.min_select !== undefined && (!Number.isInteger(question.min_select) || question.min_select < 0)) {
        throw new Error(`Question ${question.question_id} min_select must be an integer >= 0`);
      }
      if (question.max_select !== undefined && (!Number.isInteger(question.max_select) || question.max_select < 1)) {
        throw new Error(`Question ${question.question_id} max_select must be an integer >= 1`);
      }
      if (
        question.min_select !== undefined &&
        question.max_select !== undefined &&
        question.min_select > question.max_select
      ) {
        throw new Error(`Question ${question.question_id} min_select cannot exceed max_select`);
      }
    }
    return;
  }

  if (taskType === "annotate") {
    if (question.response_type !== "free_text") {
      throw new Error(`Question ${question.question_id} has invalid response_type for annotate task`);
    }
    if (question.max_chars !== undefined && (!Number.isInteger(question.max_chars) || question.max_chars < 1)) {
      throw new Error(`Question ${question.question_id} max_chars must be an integer >= 1`);
    }
    return;
  }

  if (taskType === "compare") {
    if (question.response_type !== "choice" && question.response_type !== "choice_with_rationale") {
      throw new Error(`Question ${question.question_id} has invalid response_type for compare task`);
    }
    if (question.options) {
      assertHasValidOptions(question);
    }
  }
}

function assertHasValidOptions(question: RubricQuestion): void {
  if (!question.options || question.options.length < 2) {
    throw new Error(`Question ${question.question_id} must define at least two options`);
  }

  const seen = new Set<string>();
  for (const option of question.options) {
    if (!option.value.trim()) throw new Error(`Question ${question.question_id} has option with empty value`);
    if (!option.label.trim()) throw new Error(`Question ${question.question_id} has option with empty label`);
    if (seen.has(option.value)) {
      throw new Error(`Question ${question.question_id} has duplicate option value: ${option.value}`);
    }
    seen.add(option.value);
  }
}

function getDiscreteAnswerValues(question: RubricQuestion): Set<string> {
  if (question.options && question.options.length > 0) {
    return new Set(question.options.map((option) => option.value));
  }
  if (question.response_type === "choice" || question.response_type === "choice_with_rationale") {
    return new Set(["A", "B", "tie"]);
  }
  return new Set();
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
