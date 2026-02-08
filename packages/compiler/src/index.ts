import {
  assertValidDocuments,
  assertValidStudySpec,
  deriveUnits,
  DerivedUnit,
  InputDocument,
  StudySpec
} from "@thought-tagger/core";
import { buildAssignmentManifest } from "@thought-tagger/workplan";
import { outputPath, readDocuments, readStudySpec, writeCsv, writeJson, writeJsonl } from "./io.js";

export interface CompileInput {
  specPath: string;
  datasetPath: string;
  outDir: string;
}

export async function compileStudy(input: CompileInput): Promise<void> {
  const spec = await readStudySpec(input.specPath);
  const documents = await readDocuments(input.datasetPath);

  assertValidStudySpec(spec);
  assertValidDocuments(documents);

  const units = deriveUnits(documents, spec.unitization_mode);

  await writeJson(outputPath(input.outDir, "manifest.json"), createManifest(spec, documents, units));
  await writeJsonl(outputPath(input.outDir, "units.jsonl"), units);
  await writeCsv(
    outputPath(input.outDir, "annotation_template.csv"),
    [
      "study_id",
      "rubric_version",
      "annotator_id",
      "doc_id",
      "unit_id",
      "task_type",
      "response_payload",
      "confidence",
      "rationale",
      "condition_id",
      "created_at",
      "updated_at"
    ],
    units.map((unit) => [spec.study_id, spec.rubric_version, "", unit.doc_id, unit.unit_id, spec.task_type, "", "", "", "", "", ""])
  );
  await writeJsonl(
    outputPath(input.outDir, "event_log_template.jsonl"),
    units.map((unit) => ({
      event_id: `${unit.unit_id}:open`,
      timestamp: "",
      actor_id: "",
      doc_id: unit.doc_id,
      unit_id: unit.unit_id,
      event_type: "unit_open",
      event_payload: {}
    }))
  );

  if (spec.workplan) {
    const assignmentRows = buildAssignmentManifest(units, spec.workplan);
    await writeJsonl(outputPath(input.outDir, "assignment_manifest.jsonl"), assignmentRows);
  }
}

function createManifest(spec: StudySpec, docs: InputDocument[], units: DerivedUnit[]) {
  return {
    study_id: spec.study_id,
    rubric_version: spec.rubric_version,
    task_type: spec.task_type,
    unitization_mode: spec.unitization_mode,
    run_mode: spec.run_mode,
    document_count: docs.length,
    unit_count: units.length,
    generated_at: new Date().toISOString()
  };
}
