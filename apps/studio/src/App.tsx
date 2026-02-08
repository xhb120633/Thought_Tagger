import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildArtifacts,
  deriveUnits,
  InputDoc,
  parseCsv,
  parseJsonl,
  parseRubricQuestions,
  RubricQuestion,
  RunMode,
  StudySpec,
  TaskType,
  UnitizationMode
} from "./compilerCompat";

const RUBRIC_KEY = "studio:rubric";
const RA_DRAFT_KEY = "studio:ra-draft";

type DatasetFormat = "jsonl" | "csv";

type StudioState = {
  study_id: string;
  rubric_version: string;
  task_type: TaskType;
  unitization_mode: UnitizationMode;
  run_mode: RunMode;
  annotator_ids: string;
  replication_factor: number;
  datasetText: string;
  datasetFormat: DatasetFormat;
  rubricText: string;
};

const defaultState: StudioState = {
  study_id: "demo_study",
  rubric_version: "v1",
  task_type: "annotate",
  unitization_mode: "sentence_step",
  run_mode: "participant",
  annotator_ids: "ra1,ra2",
  replication_factor: 1,
  datasetText: '{"doc_id":"d1","text":"Sentence one. Sentence two."}',
  datasetFormat: "jsonl",
  rubricText: '{\n  "questions": [\n    {\n      "question_id": "q1",\n      "prompt": "Tag notable issues in this text",\n      "response_type": "free_text",\n      "required": true\n    }\n  ]\n}'
};

function toSpec(state: StudioState, questions: RubricQuestion[]): StudySpec {
  const spec: StudySpec = {
    study_id: state.study_id,
    rubric_version: state.rubric_version,
    task_type: state.task_type,
    unitization_mode: state.unitization_mode,
    run_mode: state.run_mode,
    questions
  };
  if (state.annotator_ids.trim()) {
    spec.workplan = {
      annotator_ids: state.annotator_ids.split(",").map((id) => id.trim()).filter(Boolean),
      replication_factor: state.replication_factor,
      assignment_strategy: "round_robin"
    };
  }
  return spec;
}


async function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function App() {
  const [state, setState] = useState<StudioState>(() => {
    const savedRubric = localStorage.getItem(RUBRIC_KEY);
    return { ...defaultState, rubricText: savedRubric ?? defaultState.rubricText };
  });
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    setResumeAvailable(Boolean(localStorage.getItem(RA_DRAFT_KEY)));
  }, []);

  useEffect(() => {
    localStorage.setItem(RUBRIC_KEY, state.rubricText);
  }, [state.rubricText]);

  useEffect(() => {
    if (state.run_mode !== "ra") return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      localStorage.setItem(RA_DRAFT_KEY, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
      setStatus("RA autosaved");
    }, 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  const compiled = useMemo(() => {
    try {
      const rubricQuestions = parseRubricQuestions(state.rubricText, state.task_type);
      const spec = toSpec(state, rubricQuestions);
      if (!spec.study_id || !spec.rubric_version) {
        throw new Error("Study ID and rubric version are required");
      }
      if (spec.workplan && spec.workplan.annotator_ids.length === 0) {
        throw new Error("Workplan annotator IDs are required when workplan is enabled");
      }
      const docs: InputDoc[] = state.datasetFormat === "jsonl" ? parseJsonl(state.datasetText) : parseCsv(state.datasetText);
      const units = deriveUnits(docs, spec.unitization_mode);
      setError("");
      return { spec, docs, units };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [state]);

  const update = <K extends keyof StudioState>(key: K, value: StudioState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isCsv = file.name.endsWith(".csv");
    const isJsonl = file.name.endsWith(".jsonl");
    if (!isCsv && !isJsonl) {
      setError("Please upload a .csv or .jsonl file");
      return;
    }
    const text = await readFileText(file);
    setState((prev) => ({ ...prev, datasetText: text, datasetFormat: isCsv ? "csv" : "jsonl" }));
    setStatus(`Loaded ${file.name}`);
  };

  const resumeDraft = () => {
    const saved = localStorage.getItem(RA_DRAFT_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved) as StudioState & { savedAt?: string };
    setState((prev) => ({ ...prev, ...parsed }));
    setResumeAvailable(false);
    setStatus(`Resumed RA draft${parsed.savedAt ? ` (${parsed.savedAt})` : ""}`);
  };

  const discardDraft = () => {
    localStorage.removeItem(RA_DRAFT_KEY);
    setResumeAvailable(false);
    setStatus("Discarded RA draft");
  };

  const exportBundle = () => {
    if (!compiled) return;
    const artifacts = buildArtifacts(compiled.spec, compiled.docs, compiled.units);
    Object.entries(artifacts).forEach(([name, content]) => {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${compiled.spec.study_id}_${name}`;
      a.click();
      URL.revokeObjectURL(url);
    });
    setStatus(`Exported ${Object.keys(artifacts).length} artifacts`);
  };

  return (
    <main>
      <h1>ThoughtTagger Studio</h1>
      <p>Configure your study, upload/paste dataset input, and export compiler-compatible artifacts.</p>

      {resumeAvailable ? (
        <section>
          <p>RA draft found. Resume previous in-progress configuration?</p>
          <button onClick={resumeDraft}>Resume draft</button>
          <button onClick={discardDraft}>Discard draft</button>
        </section>
      ) : null}

      <section className="grid">
        <div>
          <h2>StudySpec Configuration</h2>
          <label>Study ID <input value={state.study_id} onChange={(e) => update("study_id", e.target.value)} /></label>
          <label>Rubric Version <input value={state.rubric_version} onChange={(e) => update("rubric_version", e.target.value)} /></label>
          <label>Task Type
            <select value={state.task_type} onChange={(e) => update("task_type", e.target.value as TaskType)}>
              <option value="label">label</option>
              <option value="annotate">annotate</option>
              <option value="compare">compare</option>
            </select>
          </label>
          <label>Unitization Mode
            <select value={state.unitization_mode} onChange={(e) => update("unitization_mode", e.target.value as UnitizationMode)}>
              <option value="document">document</option>
              <option value="sentence_step">sentence_step</option>
              <option value="target_span">target_span</option>
            </select>
          </label>
          <label>Run Mode
            <select value={state.run_mode} onChange={(e) => update("run_mode", e.target.value as RunMode)}>
              <option value="participant">participant</option>
              <option value="ra">ra</option>
            </select>
          </label>

          <h3>Workplan</h3>
          <label>Annotator IDs (comma-separated)
            <input value={state.annotator_ids} onChange={(e) => update("annotator_ids", e.target.value)} />
          </label>
          <label>Replication Factor
            <input type="number" min={1} value={state.replication_factor} onChange={(e) => update("replication_factor", Number(e.target.value || 1))} />
          </label>
        </div>

        <div>
          <h2>Dataset Input</h2>
          <label>
            Format
            <select value={state.datasetFormat} onChange={(e) => update("datasetFormat", e.target.value as DatasetFormat)}>
              <option value="jsonl">JSONL</option>
              <option value="csv">CSV</option>
            </select>
          </label>
          <label>
            Upload (.jsonl / .csv)
            <input aria-label="Upload dataset" type="file" accept=".jsonl,.csv" onChange={handleFileUpload} />
          </label>
          <textarea aria-label="Dataset text" value={state.datasetText} onChange={(e) => update("datasetText", e.target.value)} />

          <h2>Rubric Editor (persisted)</h2>
          <textarea aria-label="Rubric editor" value={state.rubricText} onChange={(e) => update("rubricText", e.target.value)} />
        </div>
      </section>

      {error ? <p className="error">Error: {error}</p> : null}
      {status ? <p>{status}</p> : null}

      {compiled ? (
        <section>
          <h2>Preview</h2>
          <ul>
            <li>Study: {compiled.spec.study_id}</li>
            <li>Documents: {compiled.docs.length}</li>
            <li>Units: {compiled.units.length}</li>
            <li>Questions: {compiled.spec.questions?.length ?? 0}</li>
            <li>Mode: {compiled.spec.unitization_mode}</li>
          </ul>
          <button onClick={exportBundle}>Export Compiler Bundle</button>
        </section>
      ) : null}
    </main>
  );
}
