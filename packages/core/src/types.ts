export type TaskType = "label" | "annotate" | "compare";
export type UnitizationMode = "document" | "sentence_step" | "target_span";
export type RunMode = "participant" | "ra";

export type ResponseType = "single_select" | "multi_select" | "free_text" | "choice" | "choice_with_rationale";

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface RubricQuestion {
  question_id: string;
  prompt: string;
  response_type: ResponseType;
  required?: boolean;
  help_text?: string;
  options?: QuestionOption[];
  min_select?: number;
  max_select?: number;
  max_chars?: number;
  placeholder?: string;
}

export interface StudySpec {
  study_id: string;
  rubric_version: string;
  task_type: TaskType;
  unitization_mode: UnitizationMode;
  run_mode: RunMode;
  questions: RubricQuestion[];
}

export interface InputDocument {
  doc_id: string;
  text: string;
  meta?: Record<string, string | number | boolean | null>;
  text_a?: string;
  text_b?: string;
}

export interface DerivedUnit {
  doc_id: string;
  unit_id: string;
  unit_type: UnitizationMode;
  index: number;
  char_start: number;
  char_end: number;
  unit_text: string;
  segmentation_version: string;
}
