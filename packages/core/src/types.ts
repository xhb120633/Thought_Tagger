export type TaskType = "label" | "annotate" | "compare";
export type UnitizationMode = "document" | "sentence_step" | "target_span";
export type RunMode = "participant" | "ra";

export interface StudyWorkplanConfig {
  annotator_ids: string[];
  replication_factor?: number;
  assignment_strategy?: "round_robin";
}

export type QuestionResponseType = "single_select" | "multi_select" | "free_text" | "choice" | "choice_with_rationale";

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface ShowIfCondition {
  question_id: string;
  equals: string;
}

export interface RubricQuestion {
  question_id: string;
  prompt: string;
  required?: boolean;
  help_text?: string;
  response_type: QuestionResponseType;
  options?: QuestionOption[];
  min_select?: number;
  max_select?: number;
  max_chars?: number;
  placeholder?: string;
  show_if?: ShowIfCondition;
}

export interface StudySpec {
  study_id: string;
  rubric_version: string;
  task_type: TaskType;
  unitization_mode: UnitizationMode;
  run_mode: RunMode;
  questions?: RubricQuestion[];
  workplan?: StudyWorkplanConfig;
}

export interface InputDocument {
  doc_id: string;
  text: string;
  meta?: Record<string, string | number | boolean | null>;
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
