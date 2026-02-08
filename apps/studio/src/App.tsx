import { useMemo, useState } from "react";

type TaskType = "label" | "annotate" | "compare";
type UnitizationMode = "document" | "sentence_step" | "target_span";
type RunMode = "participant" | "ra";

type StudySpec = {
  study_id: string;
  rubric_version: string;
  task_type: TaskType;
  unitization_mode: UnitizationMode;
  run_mode: RunMode;
};

type InputDoc = { doc_id: string; text: string };
type Unit = {
  doc_id: string;
  unit_id: string;
  unit_type: UnitizationMode;
  index: number;
  char_start: number;
  char_end: number;
  unit_text: string;
  segmentation_version: string;
};

function parseCsv(text: string): InputDoc[] {
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

function deriveUnits(docs: InputDoc[], mode: UnitizationMode): Unit[] {
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

export function App() {
  const [specText, setSpecText] = useState("");
  const [datasetText, setDatasetText] = useState("");
  const [datasetFormat, setDatasetFormat] = useState<"jsonl" | "csv">("jsonl");
  const [error, setError] = useState<string>("");

  const compiled = useMemo(() => {
    if (!specText.trim() || !datasetText.trim()) return null;
    try {
      const spec = JSON.parse(specText) as StudySpec;
      if (!spec.study_id || !spec.rubric_version || !spec.task_type || !spec.unitization_mode || !spec.run_mode) {
        throw new Error("Spec missing required fields");
      }
      const docs = datasetFormat === "jsonl"
        ? datasetText.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as InputDoc)
        : parseCsv(datasetText);
      const units = deriveUnits(docs, spec.unitization_mode);
      setError("");
      return { spec, docs, units };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [specText, datasetText, datasetFormat]);

  return (
    <main>
      <h1>ThoughtTagger Studio (MVP)</h1>
      <p>Upload/paste a study spec and dataset to validate and preview compile outputs.</p>
      <section className="grid">
        <div>
          <h2>Study Spec (JSON)</h2>
          <textarea value={specText} onChange={(e) => setSpecText(e.target.value)} placeholder='{"study_id":"demo",...}' />
        </div>
        <div>
          <h2>Dataset</h2>
          <label>
            Format
            <select value={datasetFormat} onChange={(e) => setDatasetFormat(e.target.value as "jsonl" | "csv")}>
              <option value="jsonl">JSONL</option>
              <option value="csv">CSV</option>
            </select>
          </label>
          <textarea value={datasetText} onChange={(e) => setDatasetText(e.target.value)} placeholder='{"doc_id":"d1","text":"A. B."}' />
        </div>
      </section>

      {error ? <p className="error">Error: {error}</p> : null}

      {compiled ? (
        <section>
          <h2>Preview</h2>
          <ul>
            <li>Study: {compiled.spec.study_id}</li>
            <li>Documents: {compiled.docs.length}</li>
            <li>Units: {compiled.units.length}</li>
            <li>Mode: {compiled.spec.unitization_mode}</li>
          </ul>
          <table>
            <thead>
              <tr><th>unit_id</th><th>doc_id</th><th>text</th></tr>
            </thead>
            <tbody>
              {compiled.units.slice(0, 8).map((u) => (
                <tr key={u.unit_id}><td>{u.unit_id}</td><td>{u.doc_id}</td><td>{u.unit_text}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </main>
  );
}
