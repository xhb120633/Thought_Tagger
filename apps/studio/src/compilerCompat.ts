export type TaskType = "label" | "annotate" | "compare";
export type UnitizationMode = "document" | "sentence_step" | "target_span";
export type RunMode = "participant" | "ra";

export type StudySpec = {
  study_id: string;
  rubric_version: string;
  task_type: TaskType;
  unitization_mode: UnitizationMode;
  run_mode: RunMode;
  workplan?: {
    annotator_ids: string[];
    replication_factor?: number;
    assignment_strategy?: "round_robin";
  };
};

export type InputDoc = { doc_id: string; text: string };
export type Unit = {
  doc_id: string;
  unit_id: string;
  unit_type: UnitizationMode;
  index: number;
  char_start: number;
  char_end: number;
  unit_text: string;
  segmentation_version: string;
};

export function parseJsonl(text: string): InputDoc[] {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as InputDoc);
}

export function parseCsv(text: string): InputDoc[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const idIdx = headers.indexOf("doc_id");
  const textIdx = headers.indexOf("text");
  if (idIdx < 0 || textIdx < 0) {
    throw new Error("CSV must include doc_id and text columns");
  }
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return { doc_id: (cells[idIdx] ?? "").trim(), text: (cells[textIdx] ?? "").trim() };
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  values.push(current);
  return values;
}

export function deriveUnits(docs: InputDoc[], mode: UnitizationMode): Unit[] {
  if (mode !== "sentence_step") {
    return docs.map((doc) => ({
      doc_id: doc.doc_id,
      unit_id: `${doc.doc_id}:u0`,
      unit_type: mode,
      index: 0,
      char_start: 0,
      char_end: doc.text.length,
      unit_text: doc.text,
      segmentation_version: "rulebased_v1"
    }));
  }

  const regex = /[^.!?\n]+[.!?]?/g;
  return docs.flatMap((doc) => {
    const units: Unit[] = [];
    let idx = 0;
    for (const match of doc.text.matchAll(regex)) {
      const raw = match[0];
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const offset = raw.indexOf(trimmed);
      const start = (match.index ?? 0) + offset;
      const end = start + trimmed.length;
      units.push({
        doc_id: doc.doc_id,
        unit_id: `${doc.doc_id}:u${idx}`,
        unit_type: mode,
        index: idx,
        char_start: start,
        char_end: end,
        unit_text: trimmed,
        segmentation_version: "rulebased_v1"
      });
      idx += 1;
    }
    return units.length
      ? units
      : [{
          doc_id: doc.doc_id,
          unit_id: `${doc.doc_id}:u0`,
          unit_type: mode,
          index: 0,
          char_start: 0,
          char_end: doc.text.length,
          unit_text: doc.text,
          segmentation_version: "rulebased_v1"
        }];
  });
}

export function buildArtifacts(spec: StudySpec, docs: InputDoc[], units: Unit[]): Record<string, string> {
  const out: Record<string, string> = {};
  out["manifest.json"] = JSON.stringify(createManifest(spec, docs, units), null, 2);
  out["units.jsonl"] = toJsonl(units);

  const annotationRows = units.map((unit) => [
    spec.study_id,
    spec.rubric_version,
    "",
    unit.doc_id,
    unit.unit_id,
    spec.task_type,
    "",
    "",
    "",
    "",
    "",
    ""
  ]);
  out["annotation_template.csv"] = toCsv(
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
    annotationRows
  );

  out["event_log_template.jsonl"] = toJsonl(
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
    out["assignment_manifest.jsonl"] = toJsonl(buildAssignmentManifest(units, spec.workplan));
  }

  out["studio_bundle.json"] = JSON.stringify({ spec, docs, units, generated_files: Object.keys(out) }, null, 2);
  return out;
}

function buildAssignmentManifest(units: Unit[], workplan: NonNullable<StudySpec["workplan"]>) {
  const annotators = workplan.annotator_ids;
  const replicationFactor = workplan.replication_factor ?? 1;
  return units.flatMap((unit, unitIndex) => {
    const selectedAnnotators = pickAnnotatorsRoundRobin(annotators, unitIndex, replicationFactor);
    return selectedAnnotators.map((annotatorId) => ({
      assignment_id: `${unit.unit_id}:${annotatorId}`,
      annotator_id: annotatorId,
      doc_id: unit.doc_id,
      unit_id: unit.unit_id
    }));
  });
}

function pickAnnotatorsRoundRobin(annotators: string[], unitIndex: number, replicationFactor: number): string[] {
  const out: string[] = [];
  const start = unitIndex % annotators.length;
  for (let i = 0; i < replicationFactor; i += 1) {
    out.push(annotators[(start + i) % annotators.length]);
  }
  return out;
}

function createManifest(spec: StudySpec, docs: InputDoc[], units: Unit[]) {
  return {
    study_id: spec.study_id,
    rubric_version: spec.rubric_version,
    task_type: spec.task_type,
    unitization_mode: spec.unitization_mode,
    run_mode: spec.run_mode,
    document_count: docs.length,
    unit_count: units.length,
    build_id: stableHash(JSON.stringify({ spec, docs, units }))
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

function toJsonl(rows: unknown[]) {
  return rows.map((row) => JSON.stringify(row)).join("\n");
}

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  const escapeCell = (cell: string | number): string => {
    const text = String(cell);
    const needsQuotes = /[",\n]/.test(text);
    const escaped = text.replaceAll('"', '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const csvRows = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  return csvRows.join("\n");
}
