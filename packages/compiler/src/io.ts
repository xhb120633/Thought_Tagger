import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { InputDocument, StudySpec } from "@thought-tagger/core";

export async function readStudySpec(path: string): Promise<StudySpec> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as StudySpec;
}

export async function readDocuments(path: string): Promise<InputDocument[]> {
  if (path.endsWith(".jsonl")) {
    const raw = await readFile(path, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as InputDocument);
  }

  if (path.endsWith(".csv")) {
    return parseSimpleCsv(await readFile(path, "utf8"));
  }

  throw new Error(`Unsupported dataset format for ${path}. Use .csv or .jsonl`);
}

function parseSimpleCsv(raw: string): InputDocument[] {
  const rows = raw.split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];
  const [header, ...data] = rows;
  const columns = parseCsvLine(header).map((v) => v.trim());
  const docIdIdx = columns.indexOf("doc_id");
  const textIdx = columns.indexOf("text");
  const metaColumns = columns
    .map((name, idx) => ({ name, idx }))
    .filter(({ name }) => name.startsWith("meta."));
  if (docIdIdx < 0 || textIdx < 0) {
    throw new Error("CSV needs doc_id and text columns");
  }

  return data.map((line) => {
    const cells = parseCsvLine(line);
    const metaEntries = metaColumns
      .map(({ name, idx }) => [name.slice("meta.".length), (cells[idx] ?? "").trim()] as const)
      .filter(([, value]) => value.length > 0);

    return {
      doc_id: (cells[docIdIdx] ?? "").trim(),
      text: (cells[textIdx] ?? "").trim(),
      ...(metaEntries.length > 0 ? { meta: Object.fromEntries(metaEntries) } : {})
    };
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
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


export async function readJsonlRecords(path: string): Promise<Record<string, unknown>[]> {
  const raw = await readFile(path, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

export async function writeJson(path: string, payload: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function writeJsonl(path: string, rows: unknown[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const content = rows.map((row) => JSON.stringify(row)).join("\n");
  await writeFile(path, `${content}\n`, "utf8");
}

export async function writeCsv(path: string, header: string[], rows: string[][]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const lines = [header.join(","), ...rows.map((row) => row.join(","))];
  await writeFile(path, `${lines.join("\n")}\n`, "utf8");
}

export function outputPath(outDir: string, file: string): string {
  return join(outDir, file);
}
