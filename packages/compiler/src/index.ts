import { dirname, resolve } from "node:path";
import {
  assertValidDocuments,
  assertValidStudySpec,
  deriveUnits,
  DerivedUnit,
  InputDocument,
  StudySpec
} from "@thought-tagger/core";
import { buildAssignmentManifest } from "@thought-tagger/workplan";
import { outputPath, readDocuments, readJsonlRecords, readStudySpec, writeCsv, writeJson, writeJsonl } from "./io.js";

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
  const compareContextRows = await buildCompareContextRows(spec, documents, units, input.specPath);

  await writeJson(outputPath(input.outDir, "manifest.json"), createManifest(spec, documents, units, compareContextRows));
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

  if (compareContextRows.length > 0) {
    await writeJsonl(outputPath(input.outDir, "compare_context.jsonl"), compareContextRows);
  }

  if (spec.workplan) {
    const assignmentRows = buildAssignmentManifest(units, spec.workplan);
    await writeJsonl(outputPath(input.outDir, "assignment_manifest.jsonl"), assignmentRows);
  }
}

function createManifest(
  spec: StudySpec,
  docs: InputDocument[],
  units: DerivedUnit[],
  compareContextRows: Array<{ doc_id: string; unit_id: string; shared_context: string }>
) {
  const deterministicBuildId = stableHash(JSON.stringify({ spec, docs, units, compareContextRows }));
  return {
    study_id: spec.study_id,
    rubric_version: spec.rubric_version,
    task_type: spec.task_type,
    unitization_mode: spec.unitization_mode,
    run_mode: spec.run_mode,
    question_count: spec.questions?.length ?? 0,
    conditional_question_count: (spec.questions ?? []).filter((question) => question.show_if).length,
    compare_shared_context_mode: spec.compare?.shared_context_mode ?? "none",
    shared_context_unit_count: compareContextRows.length,
    document_count: docs.length,
    unit_count: units.length,
    build_id: deterministicBuildId
  };
}

async function buildCompareContextRows(
  spec: StudySpec,
  docs: InputDocument[],
  units: DerivedUnit[],
  specPath: string
): Promise<Array<{ doc_id: string; unit_id: string; shared_context: string }>> {
  if (spec.task_type !== "compare") return [];

  const mode = spec.compare?.shared_context_mode;
  if (!mode || mode === "none") return [];

  if (mode === "inline_meta") {
    const field = spec.compare?.shared_context_field as string;
    const contextByDocId = new Map<string, string>();

    for (const doc of docs) {
      const raw = doc.meta?.[field];
      if (typeof raw !== "string" || !raw.trim()) {
        throw new Error(`Document ${doc.doc_id} is missing required meta.${field} for compare shared context mode`);
      }
      contextByDocId.set(doc.doc_id, raw);
    }

    return units.map((unit) => ({
      doc_id: unit.doc_id,
      unit_id: unit.unit_id,
      shared_context: contextByDocId.get(unit.doc_id) as string
    }));
  }

  if (mode === "sidecar_jsonl") {
    const sidecarPath = resolve(dirname(specPath), spec.compare?.shared_context_sidecar_path as string);
    const rows = await readJsonlRecords(sidecarPath);
    const contextByDocId = new Map<string, string>();

    for (const row of rows) {
      const docId = typeof row.doc_id === "string" ? row.doc_id : "";
      const sharedContext = typeof row.shared_context === "string" ? row.shared_context : "";
      if (!docId.trim() || !sharedContext.trim()) {
        throw new Error("Each compare sidecar row must include non-empty doc_id and shared_context");
      }
      if (contextByDocId.has(docId)) {
        throw new Error(`Duplicate doc_id in compare sidecar: ${docId}`);
      }
      contextByDocId.set(docId, sharedContext);
    }

    for (const doc of docs) {
      if (!contextByDocId.has(doc.doc_id)) {
        throw new Error(`Compare sidecar is missing required doc_id: ${doc.doc_id}`);
      }
    }

    return units.map((unit) => ({
      doc_id: unit.doc_id,
      unit_id: unit.unit_id,
      shared_context: contextByDocId.get(unit.doc_id) as string
    }));
  }

  throw new Error(`Unsupported compare shared context mode at compile time: ${mode}`);
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
