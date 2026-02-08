import { readFile } from "node:fs/promises";

const REQUIRED_COLUMNS = [
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
];

const path = process.argv[2];
if (!path) {
  console.error("Usage: node tools/validate-annotation-table.mjs <annotation_results.csv>");
  process.exit(1);
}

const raw = await readFile(path, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);
if (lines.length < 2) {
  throw new Error("Annotation results must include header and at least one row.");
}

const header = parseCsvLine(lines[0]);
for (const column of REQUIRED_COLUMNS) {
  if (!header.includes(column)) {
    throw new Error(`Missing required column: ${column}`);
  }
}

const colIndex = Object.fromEntries(header.map((value, idx) => [value, idx]));
for (let i = 1; i < lines.length; i += 1) {
  const row = parseCsvLine(lines[i]);
  for (const key of ["study_id", "rubric_version", "annotator_id", "doc_id", "unit_id", "task_type", "response_payload", "created_at", "updated_at"]) {
    const value = row[colIndex[key]] ?? "";
    if (!String(value).trim()) {
      throw new Error(`Row ${i + 1} has empty required field: ${key}`);
    }
  }
}

console.log(`Validated annotation table: ${path} (${lines.length - 1} row(s))`);

function parseCsvLine(line) {
  const values = [];
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
