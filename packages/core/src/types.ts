export type TaskType = "label" | "annotate" | "compare";
export type UnitizationMode = "document" | "sentence_step" | "target_span";
export type RunMode = "participant" | "ra";

export interface StudySpec {
  study_id: string;
  rubric_version: string;
  task_type: TaskType;
  unitization_mode: UnitizationMode;
  run_mode: RunMode;
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
