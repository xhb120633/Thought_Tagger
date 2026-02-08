import {
  assertValidDocuments,
  assertValidStudySpec,
  deriveUnits,
  DerivedUnit,
  InputDocument,
  StudySpec
} from "@thought-tagger/core";
import { buildAssignmentManifest } from "@thought-tagger/workplan";
import { outputPath, readDatasetBundle, readStudySpec, writeCsv, writeJson, writeJsonl } from "./io.js";
import { readFile } from "node:fs/promises";

export interface CompileInput {
  specPath: string;
  datasetPath: string;
  datasetPathB?: string;
  outDir: string;
  contextSidecarPath?: string;
}

export async function compileStudy(input: CompileInput): Promise<void> {
  const spec = await readStudySpec(input.specPath);
  const datasets = await readDatasetBundle(input.datasetPath, input.datasetPathB);

  assertValidStudySpec(spec);

  const documents = buildCompilationDocuments(spec, datasets.primary, datasets.secondary, input.datasetPathB);
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

function buildCompilationDocuments(
  spec: StudySpec,
  primaryDocuments: InputDocument[],
  secondaryDocuments: InputDocument[],
  datasetPathB?: string
): InputDocument[] {
  if (spec.task_type !== "compare") {
    if (datasetPathB) throw new Error("Secondary dataset input is only supported when task_type=compare");
    return primaryDocuments;
  }

  const pairing = spec.compare_pairing;
  if (!pairing) {
    throw new Error("compare_pairing is required when task_type=compare");
  }

  if (pairing.mode === "single_file") {
    if (secondaryDocuments.length > 0) {
      throw new Error("compare_pairing.mode=single_file does not support a secondary dataset");
    }
    return createComparePairs(primaryDocuments, primaryDocuments, pairing.policy, pairing.seed ?? spec.study_id, true);
  }

  if (secondaryDocuments.length === 0) {
    throw new Error("compare_pairing.mode=two_file requires a secondary dataset input");
  }

  return createComparePairs(primaryDocuments, secondaryDocuments, pairing.policy, pairing.seed ?? spec.study_id, false);
}

function createComparePairs(
  leftInput: InputDocument[],
  rightInput: InputDocument[],
  policy: "by_index" | "random_pair",
  seed: string,
  singleFileMode: boolean
): InputDocument[] {
  if (leftInput.length === 0) {
    throw new Error("Compare datasets must include at least one document");
  }

  if (singleFileMode) {
    if (leftInput.length % 2 !== 0) {
      throw new Error("compare_pairing.mode=single_file requires an even number of documents");
    }
    const pool = policy === "random_pair" ? seededShuffle(leftInput, seed) : [...leftInput];
    const pairs: [InputDocument, InputDocument][] = [];
    for (let i = 0; i < pool.length; i += 2) {
      pairs.push([pool[i], pool[i + 1]]);
    }
    return flattenPairRows(pairs);
  }

  if (leftInput.length !== rightInput.length) {
    throw new Error("compare_pairing.mode=two_file requires equal dataset lengths");
  }

  const rightPool = policy === "random_pair" ? seededShuffle(rightInput, seed) : [...rightInput];
  const pairs: [InputDocument, InputDocument][] = leftInput.map((leftDoc, index) => [leftDoc, rightPool[index]]);
  return flattenPairRows(pairs);
}

function flattenPairRows(pairs: [InputDocument, InputDocument][]): InputDocument[] {
  return pairs.flatMap(([docA, docB], index) => {
    const pairId = `pair_${index + 1}`;
    return [
      {
        ...docA,
        doc_id: `${pairId}:A`,
        pair_id: pairId,
        meta: { ...(docA.meta ?? {}), compare_source_doc_id: docA.doc_id, compare_slot: "A" }
      },
      {
        ...docB,
        doc_id: `${pairId}:B`,
        pair_id: pairId,
        meta: { ...(docB.meta ?? {}), compare_source_doc_id: docB.doc_id, compare_slot: "B" }
      }
    ];
  });
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const result = [...items];
  let state = seedState(seed);

  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function seedState(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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
    compare_pairing_mode: spec.compare_pairing?.mode ?? null,
    compare_pairing_policy: spec.compare_pairing?.policy ?? null,
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
