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
import { readFile } from "node:fs/promises";

export interface CompileInput {
  specPath: string;
  datasetPath: string;
  outDir: string;
  contextSidecarPath?: string;
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
      "compare_context",
      "created_at",
      "updated_at"
    ],
    units.map((unit) => [spec.study_id, spec.rubric_version, "", unit.doc_id, unit.unit_id, spec.task_type, "", "", "", "", "", "", ""])
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

  const compareContextRows = await buildCompareContextRows(spec, units, input.contextSidecarPath);
  if (compareContextRows.length > 0) {
    await writeJsonl(outputPath(input.outDir, "compare_context.jsonl"), compareContextRows);
  }
}

async function buildCompareContextRows(spec: StudySpec, units: DerivedUnit[], contextSidecarPath?: string): Promise<unknown[]> {
  if (spec.task_type !== "compare" || !spec.compare_context) return [];

  if (spec.compare_context.mode === "inline_meta") {
    const key = spec.compare_context.context_meta_key ?? "";
    return units.map((unit) => ({
      unit_id: unit.unit_id,
      pair_id: unit.pair_id ?? null,
      context: unit.meta?.[key] ?? null
    }));
  }

  const pairField = spec.compare_context.sidecar_pair_id_field ?? "pair_id";
  const contextField = spec.compare_context.sidecar_context_field ?? "context";
  if (!contextSidecarPath) {
    throw new Error("compare_context.mode=sidecar requires --context-sidecar path");
  }

  const sidecarRows = await readJsonlRows(contextSidecarPath);
  const sidecarByPair = new Map<string, string>();
  for (const row of sidecarRows) {
    const pairId = String((row as Record<string, unknown>)[pairField] ?? "").trim();
    const context = String((row as Record<string, unknown>)[contextField] ?? "").trim();
    if (!pairId) throw new Error(`Sidecar row missing ${pairField}`);
    if (!context) throw new Error(`Sidecar row missing ${contextField} for pair_id ${pairId}`);
    if (sidecarByPair.has(pairId)) throw new Error(`Duplicate sidecar pair_id detected: ${pairId}`);
    sidecarByPair.set(pairId, context);
  }

  const rows = units.map((unit) => {
    const pairId = unit.pair_id ?? "";
    if (!pairId) throw new Error(`Unit ${unit.unit_id} missing pair_id required for sidecar context mapping`);
    const context = sidecarByPair.get(pairId);
    if (!context) throw new Error(`No sidecar context found for pair_id ${pairId}`);
    return {
      unit_id: unit.unit_id,
      pair_id: pairId,
      context
    };
  });

  return rows;
}

async function readJsonlRows(path: string): Promise<unknown[]> {
  const raw = await readFile(path, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as unknown);
}

function createManifest(spec: StudySpec, docs: InputDocument[], units: DerivedUnit[]) {
  const deterministicBuildId = stableHash(JSON.stringify({ spec, docs, units }));
  return {
    study_id: spec.study_id,
    rubric_version: spec.rubric_version,
    task_type: spec.task_type,
    unitization_mode: spec.unitization_mode,
    run_mode: spec.run_mode,
    question_count: spec.questions?.length ?? 0,
    conditional_question_count: (spec.questions ?? []).filter((question) => question.show_if).length,
    compare_context_mode: spec.compare_context?.mode ?? null,
    document_count: docs.length,
    unit_count: units.length,
    build_id: deterministicBuildId
  };
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
