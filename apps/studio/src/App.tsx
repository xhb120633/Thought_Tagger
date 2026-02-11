import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { StudioGuidePanel } from "./components/StudioGuidePanel";
import { StudioHeader } from "./components/StudioHeader";
import {
  buildArtifacts,
  deriveUnits,
  InputDoc,
  parseCsv,
  parseJsonl,
  RunMode,
  StudySpec,
  TaskType,
  Unit,
  UnitizationMode
} from "./compilerCompat";

type DatasetFormat = "jsonl" | "csv";
type SavePolicy = "submit_end" | "checkpoint" | "autosave";

type LabelDraft = {
  id: string;
  name: string;
  definition: string;
  example: string;
  counterexample: string;
  color: string;
};

type StudioDraft = {
  study_id: string;
  study_name: string;
  description: string;
  datasetText: string;
  datasetFormat: DatasetFormat;
  task_type: TaskType;
  unitization_mode: UnitizationMode;
  rubric_version: string;
  instructions_global: string;
  instructions_task: string;
  run_mode: RunMode;
  save_policy: SavePolicy;
  annotator_ids: string;
  replication_factor: number;
  labels: LabelDraft[];
  enableConfidence: boolean;
  enableRationale: boolean;
};

const DRAFT_KEY = "studio:guided-draft";
const GUIDE_COLLAPSED_KEY = "thoughttagger:studioGuideCollapsed";
const LABEL_COLORS = ["#dbeafe", "#ede9fe", "#dcfce7", "#fef3c7", "#fee2e2", "#fce7f3"];

const defaultDraft: StudioDraft = {
  study_id: "demo_study",
  study_name: "ThoughtTagger Demo Study",
  description: "Spec-driven annotation study for think-aloud data.",
  datasetText:
    '{"doc_id":"d1","text":"I reviewed two solutions. First I checked assumptions. Then I compared runtime tradeoffs."}\n{"doc_id":"d2","text":"I started unsure, then validated with a small example and changed my answer."}',
  datasetFormat: "jsonl",
  task_type: "label",
  unitization_mode: "sentence_step",
  rubric_version: "v2",
  instructions_global: "Read the full response before making sentence-level judgments.",
  instructions_task: "Tag each sentence with the best-fitting label and optional rationale.",
  run_mode: "participant",
  save_policy: "submit_end",
  annotator_ids: "ra1,ra2,ra3",
  replication_factor: 2,
  labels: [
    {
      id: "problem_framing",
      name: "Problem framing",
      definition: "Sentence defines the task, assumptions, or constraints before solving.",
      example: "I first identified what the question is really asking.",
      counterexample: "I chose option B.",
      color: LABEL_COLORS[0]
    },
    {
      id: "verification",
      name: "Verification",
      definition: "Sentence checks correctness, test cases, or consistency.",
      example: "I validated this with a tiny example.",
      counterexample: "I guessed and moved on.",
      color: LABEL_COLORS[2]
    }
  ],
  enableConfidence: true,
  enableRationale: true
};

function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function parseDataset(format: DatasetFormat, text: string): InputDoc[] {
  return format === "jsonl" ? parseJsonl(text) : parseCsv(text);
}

function validateDataset(docs: InputDoc[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  docs.forEach((doc, index) => {
    if (!doc.doc_id.trim()) errors.push(`Row ${index + 1}: missing doc_id`);
    if (!doc.text.trim()) errors.push(`Row ${index + 1}: empty text`);
    if (ids.has(doc.doc_id)) errors.push(`Duplicate doc_id: ${doc.doc_id}`);
    ids.add(doc.doc_id);
    if (doc.text.length > 5000) warnings.push(`doc_id ${doc.doc_id} has very long text (${doc.text.length} chars)`);
  });
  return { errors, warnings };
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function classForUnitState(state: "active" | "done" | "queued") {
  if (state === "active") return "unit-chip active";
  if (state === "done") return "unit-chip done";
  return "unit-chip";
}

function AnnotatorWorkspace({
  spec,
  docs,
  units,
  labels,
  enableConfidence,
  enableRationale
}: {
  spec: StudySpec;
  docs: InputDoc[];
  units: Unit[];
  labels: LabelDraft[];
  enableConfidence: boolean;
  enableRationale: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [labelByUnit, setLabelByUnit] = useState<Record<string, string>>({});
  const [confidenceByUnit, setConfidenceByUnit] = useState<Record<string, string>>({});
  const [rationaleByUnit, setRationaleByUnit] = useState<Record<string, string>>({});
  const [spansByUnit, setSpansByUnit] = useState<Record<string, Array<{ text: string; labelId: string }>>>({});
  const [selectionText, setSelectionText] = useState("");
  const [savedAt, setSavedAt] = useState("");

  const activeUnit = units[activeIndex];
  const activeDoc = docs.find((doc) => doc.doc_id === activeUnit?.doc_id) ?? docs[0];
  const activeSentenceIndex = activeUnit?.index ?? 0;
  const sentences = splitSentences(activeDoc?.text ?? "");

  useEffect(() => {
    if (spec.run_mode !== "ra") return;
    const payload = { labelByUnit, confidenceByUnit, rationaleByUnit, spansByUnit, updatedAt: new Date().toISOString() };
    localStorage.setItem("studio:annotator-preview", JSON.stringify(payload));
    setSavedAt(payload.updatedAt);
  }, [labelByUnit, confidenceByUnit, rationaleByUnit, spansByUnit, spec.run_mode]);

  const onTextMouseUp = () => {
    const selected = window.getSelection()?.toString() ?? "";
    setSelectionText(selected.trim());
  };

  const addSpan = (labelId: string) => {
    if (!selectionText || !activeUnit) return;
    const next = [...(spansByUnit[activeUnit.unit_id] ?? []), { text: selectionText, labelId }];
    setSpansByUnit((curr) => ({ ...curr, [activeUnit.unit_id]: next }));
    setSelectionText("");
  };

  const isDone = (unit: Unit) => {
    const hasLabel = Boolean(labelByUnit[unit.unit_id]);
    const hasSpan = (spansByUnit[unit.unit_id] ?? []).length > 0;
    return spec.unitization_mode === "target_span" ? hasSpan : hasLabel;
  };

  return (
    <section className="workspace card">
      <header className="workspace-head">
        <div>
          <h3>Annotator Workspace (document-centric preview)</h3>
          <p className="muted">
            Same interface across modes. Policy only changes: participant submits once, RA can resume with checkpointed state.
          </p>
        </div>
        <div className="workspace-meta">
          <span className="badge">Unit {activeIndex + 1}/{units.length}</span>
          {spec.run_mode === "ra" ? <span className="badge success">Resumable • Saved {savedAt ? new Date(savedAt).toLocaleTimeString() : "…"}</span> : <span className="badge">Participant • fixed run</span>}
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="panel">
          <h4>Document outline</h4>
          <p className="muted">Jump directly to sentence/step units.</p>
          <div className="unit-list">
            {units.map((unit, idx) => {
              const state = idx === activeIndex ? "active" : isDone(unit) ? "done" : "queued";
              return (
                <button key={unit.unit_id} className={classForUnitState(state)} onClick={() => setActiveIndex(idx)}>
                  <strong>#{idx + 1}</strong>
                  <span>{unit.unit_text.slice(0, 72)}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="panel reading-surface" onMouseUp={onTextMouseUp}>
          <h4>{activeDoc?.doc_id}</h4>
          <p className="muted">Full context is always visible. Active unit is highlighted.</p>
          <div className="document-flow">
            {(sentences.length ? sentences : [activeDoc?.text ?? ""]).map((sentence, idx) => {
              const active = spec.unitization_mode === "document" ? idx === 0 : idx === activeSentenceIndex;
              return (
                <p key={`${idx}-${sentence.slice(0, 8)}`} className={`sentence ${active ? "active" : ""}`}>
                  <span className="index">{idx + 1}</span>
                  {sentence}
                </p>
              );
            })}
          </div>
        </article>

        <aside className="panel controls">
          <h4>Tagging controls</h4>
          <div className="inline-actions">
            <button onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}>Prev</button>
            <button onClick={() => setActiveIndex((idx) => Math.min(units.length - 1, idx + 1))}>Next</button>
          </div>

          <div className="card compact">
            <h5>Label decision</h5>
            <div className="label-grid">
              {labels.map((label) => (
                <button
                  key={label.id}
                  className={`label-token ${labelByUnit[activeUnit?.unit_id ?? ""] === label.id ? "selected" : ""}`}
                  style={{ background: label.color }}
                  onClick={() => activeUnit && setLabelByUnit((curr) => ({ ...curr, [activeUnit.unit_id]: label.id }))}
                >
                  {label.name}
                </button>
              ))}
            </div>
          </div>

          {spec.unitization_mode === "target_span" ? (
            <div className="card compact">
              <h5>Span tagging</h5>
              {selectionText ? <div className="alert">Selected span: “{selectionText}”</div> : <p className="muted">Highlight text in the document, then choose a label.</p>}
              <div className="label-grid">
                {labels.map((label) => (
                  <button key={`${label.id}-span`} style={{ background: label.color }} onClick={() => addSpan(label.id)}>
                    Tag as {label.name}
                  </button>
                ))}
              </div>
              {(spansByUnit[activeUnit?.unit_id ?? ""] ?? []).map((span, idx) => (
                <p className="span-pill" key={`${span.labelId}-${idx}`}>
                  <strong>{labels.find((label) => label.id === span.labelId)?.name}:</strong> {span.text}
                </p>
              ))}
            </div>
          ) : null}

          {enableConfidence ? (
            <label>
              Confidence
              <select
                value={confidenceByUnit[activeUnit?.unit_id ?? ""] ?? ""}
                onChange={(event) => activeUnit && setConfidenceByUnit((curr) => ({ ...curr, [activeUnit.unit_id]: event.target.value }))}
              >
                <option value="">Select confidence</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          ) : null}

          {enableRationale ? (
            <label>
              Rationale (optional)
              <textarea
                value={rationaleByUnit[activeUnit?.unit_id ?? ""] ?? ""}
                onChange={(event) => activeUnit && setRationaleByUnit((curr) => ({ ...curr, [activeUnit.unit_id]: event.target.value }))}
              />
            </label>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

export function App() {
  const [draft, setDraft] = useState<StudioDraft>(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return defaultDraft;
    try {
      return { ...defaultDraft, ...(JSON.parse(saved) as Partial<StudioDraft>) };
    } catch {
      return defaultDraft;
    }
  });
  const [globalError, setGlobalError] = useState("");
  const [guideHiddenByDefault, setGuideHiddenByDefault] = useState(() => localStorage.getItem(GUIDE_COLLAPSED_KEY) === "true");
  const [isGuideVisible, setIsGuideVisible] = useState(() => localStorage.getItem(GUIDE_COLLAPSED_KEY) !== "true");

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    localStorage.setItem(GUIDE_COLLAPSED_KEY, String(guideHiddenByDefault));
  }, [guideHiddenByDefault]);

  const docs = useMemo(() => {
    try {
      setGlobalError("");
      return parseDataset(draft.datasetFormat, draft.datasetText);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : String(error));
      return [];
    }
  }, [draft.datasetFormat, draft.datasetText]);

  const datasetValidation = useMemo(() => validateDataset(docs), [docs]);
  const units = useMemo(() => deriveUnits(docs, draft.unitization_mode), [docs, draft.unitization_mode]);

  const totalSentenceJudgments = units.length * draft.replication_factor;
  const annotatorCount = draft.annotator_ids.split(",").map((value) => value.trim()).filter(Boolean).length || 1;
  const workPerRater = Math.ceil(totalSentenceJudgments / annotatorCount);

  const compiled = useMemo(() => {
    try {
      if (!draft.study_id.trim()) throw new Error("Study ID is required.");
      if (datasetValidation.errors.length) throw new Error("Fix dataset validation errors before export.");
      // Studio Guide Panel content is intentionally UI-only and never serialized into StudySpec or export artifacts.
      const spec: StudySpec = {
        study_id: draft.study_id,
        rubric_version: draft.rubric_version,
        task_type: draft.task_type,
        unitization_mode: draft.unitization_mode,
        run_mode: draft.run_mode,
        questions: [
          {
            question_id: "label_primary",
            prompt: "Choose the best label.",
            required: true,
            response_type: "single_select",
            options: draft.labels.map((label) => ({ value: label.id, label: label.name, description: label.definition }))
          }
        ],
        workplan: {
          annotator_ids: draft.annotator_ids
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          replication_factor: draft.replication_factor,
          assignment_strategy: "round_robin"
        }
      };
      return { spec, docs, units };
    } catch {
      return null;
    }
  }, [datasetValidation.errors.length, docs, draft, units]);

  const update = <K extends keyof StudioDraft>(key: K, value: StudioDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const format: DatasetFormat = file.name.endsWith(".csv") ? "csv" : "jsonl";
    update("datasetFormat", format);
    update("datasetText", await readFileText(file));
  };

  const exportBundle = () => {
    if (!compiled) return;
    const artifacts = buildArtifacts(compiled.spec, compiled.docs, compiled.units);
    Object.entries(artifacts).forEach(([name, content]) => {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${compiled.spec.study_id}_${name}`;
      anchor.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <main className="app-shell">
      <StudioHeader onOpenGuide={() => setIsGuideVisible(true)} guideHiddenByDefault={guideHiddenByDefault} />

      <StudioGuidePanel
        isVisible={isGuideVisible}
        onClose={() => setIsGuideVisible(false)}
        dontShowAgain={guideHiddenByDefault}
        onDontShowAgainChange={(next) => {
          setGuideHiddenByDefault(next);
          if (next) setIsGuideVisible(false);
        }}
      />

      <section className="studio-layout">
        <div className="content-stack">
          <section className="card">
            <h2>Study Overview</h2>
            <div className="form-grid">
              <label>Study Name <input value={draft.study_name} onChange={(event) => update("study_name", event.target.value)} /></label>
              <label>Study ID <input value={draft.study_id} onChange={(event) => update("study_id", event.target.value)} /></label>
              <label className="full">Description <textarea value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
            </div>
          </section>

          <section className="card">
            <h2>Data</h2>
            <div className="inline-actions">
              <label>Format
                <select value={draft.datasetFormat} onChange={(event) => update("datasetFormat", event.target.value as DatasetFormat)}>
                  <option value="jsonl">JSONL</option>
                  <option value="csv">CSV</option>
                </select>
              </label>
              <label>Upload dataset<input aria-label="Upload dataset" type="file" accept=".jsonl,.csv" onChange={onUpload} /></label>
            </div>
            <textarea aria-label="Dataset text" value={draft.datasetText} onChange={(event) => update("datasetText", event.target.value)} />
            {datasetValidation.errors.length ? <div className="alert danger"><strong>Dataset errors:</strong> {datasetValidation.errors.join(" • ")}</div> : null}
            {datasetValidation.warnings.length ? <div className="alert warning">{datasetValidation.warnings.join(" • ")}</div> : null}
          </section>

          <section className="card">
            <h2>Annotation Design</h2>
            <div className="form-grid">
              <label>Task Type
                <select value={draft.task_type} onChange={(event) => update("task_type", event.target.value as TaskType)}>
                  <option value="label">label</option>
                  <option value="annotate">annotate</option>
                  <option value="compare">compare</option>
                </select>
              </label>
              <label>Unitization
                <select value={draft.unitization_mode} onChange={(event) => update("unitization_mode", event.target.value as UnitizationMode)}>
                  <option value="document">document</option>
                  <option value="sentence_step">sentence/step</option>
                  <option value="target_span">target_span</option>
                </select>
              </label>
            </div>
            <div className="alert subtle">Unitization consequences: document-level gives holistic judgments, sentence/step maximizes granularity, target_span adds fine evidence links with higher cognitive load.</div>
          </section>

          <section className="card">
            <div className="inline-actions spread">
              <h2>Rubric — Label System Designer</h2>
              <button
                onClick={() =>
                  update("labels", [
                    ...draft.labels,
                    {
                      id: `label_${draft.labels.length + 1}`,
                      name: `Label ${draft.labels.length + 1}`,
                      definition: "",
                      example: "",
                      counterexample: "",
                      color: LABEL_COLORS[draft.labels.length % LABEL_COLORS.length]
                    }
                  ])
                }
              >
                Add label
              </button>
            </div>
            {draft.labels.map((label, idx) => (
              <div className="label-editor" key={label.id}>
                <div className="inline-actions">
                  <span className="label-chip" style={{ background: label.color }}>{label.name || "Untitled label"}</span>
                  <button onClick={() => update("labels", draft.labels.filter((_, index) => index !== idx))}>Remove</button>
                </div>
                <div className="form-grid">
                  <label>ID<input value={label.id} onChange={(event) => update("labels", draft.labels.map((entry, index) => (index === idx ? { ...entry, id: event.target.value } : entry)))} /></label>
                  <label>Name<input value={label.name} onChange={(event) => update("labels", draft.labels.map((entry, index) => (index === idx ? { ...entry, name: event.target.value } : entry)))} /></label>
                  <label className="full">Definition<textarea value={label.definition} onChange={(event) => update("labels", draft.labels.map((entry, index) => (index === idx ? { ...entry, definition: event.target.value } : entry)))} /></label>
                  <label>Example<input value={label.example} onChange={(event) => update("labels", draft.labels.map((entry, index) => (index === idx ? { ...entry, example: event.target.value } : entry)))} /></label>
                  <label>Counterexample<input value={label.counterexample} onChange={(event) => update("labels", draft.labels.map((entry, index) => (index === idx ? { ...entry, counterexample: event.target.value } : entry)))} /></label>
                </div>
              </div>
            ))}
            <div className="inline-actions">
              <label><input type="checkbox" checked={draft.enableConfidence} onChange={(event) => update("enableConfidence", event.target.checked)} /> Confidence addon</label>
              <label><input type="checkbox" checked={draft.enableRationale} onChange={(event) => update("enableRationale", event.target.checked)} /> Rationale addon</label>
            </div>
          </section>

          <section className="card">
            <h2>Instructions</h2>
            <label>Global instructions<textarea value={draft.instructions_global} onChange={(event) => update("instructions_global", event.target.value)} /></label>
            <label>Task instructions<textarea value={draft.instructions_task} onChange={(event) => update("instructions_task", event.target.value)} /></label>
          </section>

          <section className="card">
            <h2>Execution Plan</h2>
            <div className="form-grid">
              <label>Run mode
                <select value={draft.run_mode} onChange={(event) => update("run_mode", event.target.value as RunMode)}>
                  <option value="participant">participant</option>
                  <option value="ra">RA (resumable)</option>
                </select>
              </label>
              <label>Save policy
                <select value={draft.save_policy} onChange={(event) => update("save_policy", event.target.value as SavePolicy)}>
                  <option value="submit_end">submit_end</option>
                  <option value="checkpoint">checkpoint</option>
                  <option value="autosave">autosave</option>
                </select>
              </label>
              <label className="full">Annotator IDs<input value={draft.annotator_ids} onChange={(event) => update("annotator_ids", event.target.value)} /></label>
              <label>Replication factor (k)<input type="number" min={1} value={draft.replication_factor} onChange={(event) => update("replication_factor", Number(event.target.value || 1))} /></label>
            </div>
            <div className="workload-grid">
              <div className="workload-card"><strong>{docs.length}</strong><span>documents</span></div>
              <div className="workload-card"><strong>{units.length}</strong><span>sentences/units</span></div>
              <div className="workload-card"><strong>{draft.replication_factor}</strong><span>raters per document</span></div>
              <div className="workload-card"><strong>{totalSentenceJudgments}</strong><span>total sentence judgments</span></div>
              <div className="workload-card"><strong>{workPerRater}</strong><span>estimated work per rater</span></div>
            </div>
            <div className="alert subtle">Replication policy: each document is assigned to k distinct raters, and each assigned rater labels all units in that document.</div>
          </section>

          <section className="card">
            <div className="inline-actions spread">
              <h2>Review & Export</h2>
              <button className="primary" onClick={exportBundle} disabled={!compiled}>Export Bundle</button>
            </div>
            {globalError ? <div className="alert danger">{globalError}</div> : null}
            <ul>
              <li>Study Spec generated from constrained primitives only.</li>
              <li>Live preview reflects current label system, unitization, and run mode policy.</li>
              <li>Commercial-quality target: calm typography, explicit states, and cognition-first layout.</li>
            </ul>
          </section>
        </div>

        {compiled ? (
          <div className="preview-column">
            <AnnotatorWorkspace
              spec={compiled.spec}
              docs={compiled.docs}
              units={compiled.units}
              labels={draft.labels}
              enableConfidence={draft.enableConfidence}
              enableRationale={draft.enableRationale}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}


export default App;
