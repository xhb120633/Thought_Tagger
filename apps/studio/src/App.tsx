import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  buildArtifacts,
  deriveUnits,
  InputDoc,
  parseCsv,
  parseJsonl,
  QuestionResponseType,
  RubricQuestion,
  RunMode,
  StudySpec,
  TaskType,
  Unit,
  UnitizationMode
} from "./compilerCompat";

type DatasetFormat = "jsonl" | "csv";
type SavePolicy = "submit_end" | "checkpoint" | "autosave";

type OptionDraft = {
  value: string;
  label: string;
  description: string;
};

type QuestionDraft = {
  question_id: string;
  prompt: string;
  required: boolean;
  help_text: string;
  response_type: QuestionResponseType;
  options: OptionDraft[];
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
  questions: QuestionDraft[];
  instructions_global: string;
  instructions_task: string;
  run_mode: RunMode;
  save_policy: SavePolicy;
  annotator_ids: string;
  replication_factor: number;
  groups: number;
};

type StudioStepKey =
  | "create"
  | "dataset"
  | "task"
  | "unitization"
  | "rubric"
  | "instructions"
  | "runmode"
  | "workplan"
  | "review";

const DRAFT_KEY = "studio:guided-draft";
const RA_PREVIEW_KEY = "studio:annotator-preview";

const STEP_ORDER: Array<{ key: StudioStepKey; title: string }> = [
  { key: "create", title: "Create Study" },
  { key: "dataset", title: "Upload Dataset" },
  { key: "task", title: "Choose Task Type" },
  { key: "unitization", title: "Choose Unitization" },
  { key: "rubric", title: "Build Rubric" },
  { key: "instructions", title: "Write Instructions" },
  { key: "runmode", title: "Run Mode" },
  { key: "workplan", title: "Work Plan" },
  { key: "review", title: "Review & Export" }
];

const LABEL_COLORS = ["#e0f2fe", "#ede9fe", "#dcfce7", "#fef3c7", "#fee2e2", "#fce7f3"];

function defaultQuestionForTask(taskType: TaskType, idx = 1): QuestionDraft {
  if (taskType === "annotate") {
    return {
      question_id: `q_${idx}`,
      prompt: "Write an annotation for this unit",
      required: true,
      help_text: "",
      response_type: "free_text",
      options: []
    };
  }
  if (taskType === "compare") {
    return {
      question_id: `q_${idx}`,
      prompt: "Which candidate is better?",
      required: true,
      help_text: "Include rationale when uncertain.",
      response_type: "choice_with_rationale",
      options: [
        { value: "A", label: "Candidate A", description: "" },
        { value: "B", label: "Candidate B", description: "" },
        { value: "TIE", label: "Tie", description: "" }
      ]
    };
  }
  return {
    question_id: `q_${idx}`,
    prompt: "Select the best label",
    required: true,
    help_text: "",
    response_type: "single_select",
    options: [
      { value: "opt_1", label: "Label 1", description: "" },
      { value: "opt_2", label: "Label 2", description: "" }
    ]
  };
}

const defaultDraft: StudioDraft = {
  study_id: "demo_study",
  study_name: "ThoughtTagger Demo Study",
  description: "Pilot study for CoT annotation",
  datasetText:
    '{"doc_id":"d1","text":"Sentence one. Sentence two."}\n{"doc_id":"d2","text":"Another reflective answer with two steps. It continues."}',
  datasetFormat: "jsonl",
  task_type: "label",
  unitization_mode: "sentence_step",
  rubric_version: "v1",
  questions: [defaultQuestionForTask("label")],
  instructions_global: "Read each response carefully and apply the rubric consistently.",
  instructions_task: "Use one best-fit label per unit unless noted otherwise.",
  run_mode: "participant",
  save_policy: "submit_end",
  annotator_ids: "ra1,ra2,ra3",
  replication_factor: 1,
  groups: 1
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

function validateQuestions(taskType: TaskType, questions: QuestionDraft[]) {
  const errors: string[] = [];
  const ids = new Set<string>();
  questions.forEach((q, idx) => {
    if (!q.question_id.trim()) errors.push(`Question ${idx + 1}: question_id is required`);
    if (!q.prompt.trim()) errors.push(`Question ${idx + 1}: prompt is required`);
    if (ids.has(q.question_id)) errors.push(`Duplicate question_id: ${q.question_id}`);
    ids.add(q.question_id);

    if (taskType === "annotate" && q.response_type !== "free_text") {
      errors.push(`Question ${q.question_id}: annotate tasks require free_text response_type`);
    }
    if (taskType === "label" && q.response_type !== "single_select" && q.response_type !== "multi_select") {
      errors.push(`Question ${q.question_id}: label tasks require single_select or multi_select response_type`);
    }
    if (taskType === "compare" && q.response_type !== "choice" && q.response_type !== "choice_with_rationale") {
      errors.push(`Question ${q.question_id}: compare tasks require choice or choice_with_rationale response_type`);
    }

    if (q.response_type !== "free_text" && q.options.filter((o) => o.value.trim() && o.label.trim()).length < 2) {
      errors.push(`Question ${q.question_id}: at least two options are required`);
    }
  });
  return errors;
}

function toRubricQuestions(questions: QuestionDraft[]): RubricQuestion[] {
  return questions.map((q) => ({
    question_id: q.question_id,
    prompt: q.prompt,
    required: q.required,
    help_text: q.help_text || undefined,
    response_type: q.response_type,
    options:
      q.response_type === "free_text"
        ? undefined
        : q.options
            .filter((opt) => opt.value.trim() && opt.label.trim())
            .map((opt) => ({ value: opt.value, label: opt.label, description: opt.description || undefined }))
  }));
}

function classForStatus(status: "complete" | "in_progress" | "blocked" | "todo") {
  if (status === "complete") return "badge success";
  if (status === "in_progress") return "badge info";
  if (status === "blocked") return "badge danger";
  return "badge";
}

function optionsForTask(taskType: TaskType): QuestionResponseType[] {
  if (taskType === "annotate") return ["free_text"];
  if (taskType === "compare") return ["choice", "choice_with_rationale"];
  return ["single_select", "multi_select"];
}

function AnnotatorWorkspace({ spec, docs, units }: { spec: StudySpec; docs: InputDoc[]; units: Unit[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [labelByUnit, setLabelByUnit] = useState<Record<string, string>>({});
  const [noteByUnit, setNoteByUnit] = useState<Record<string, string>>({});
  const [spansByUnit, setSpansByUnit] = useState<Record<string, Array<{ text: string; labelId: string; ts: string }>>>({});
  const [selectionText, setSelectionText] = useState("");
  const [compareDecision, setCompareDecision] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState("");

  const activeUnit = units[activeIndex];
  const activeDoc = docs.find((doc) => doc.doc_id === activeUnit?.doc_id) ?? docs[0];

  const firstQuestion = spec.questions?.[0];
  const palette = (firstQuestion?.options ?? []).map((opt, idx) => ({ ...opt, color: LABEL_COLORS[idx % LABEL_COLORS.length] }));

  useEffect(() => {
    if (spec.run_mode !== "ra") return;
    const payload = { labelByUnit, noteByUnit, spansByUnit, compareDecision, updatedAt: new Date().toISOString() };
    localStorage.setItem(RA_PREVIEW_KEY, JSON.stringify(payload));
    setSavedAt(payload.updatedAt);
  }, [labelByUnit, noteByUnit, spansByUnit, compareDecision, spec.run_mode]);

  useEffect(() => {
    const handle = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() === "n") setActiveIndex((idx) => Math.min(units.length - 1, idx + 1));
      if (event.key.toLowerCase() === "p") setActiveIndex((idx) => Math.max(0, idx - 1));
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [units.length]);

  const addSpan = (labelId: string) => {
    if (!selectionText.trim() || !activeUnit) return;
    const next = [...(spansByUnit[activeUnit.unit_id] ?? []), { text: selectionText.trim(), labelId, ts: new Date().toLocaleTimeString() }];
    setSpansByUnit((curr) => ({ ...curr, [activeUnit.unit_id]: next }));
    setSelectionText("");
  };

  const doneCount = Object.keys(labelByUnit).length + Object.keys(noteByUnit).filter((k) => noteByUnit[k]).length;
  const progress = Math.min(100, Math.round((doneCount / Math.max(units.length, 1)) * 100));

  const onTextMouseUp = () => {
    const selected = window.getSelection()?.toString() ?? "";
    setSelectionText(selected);
  };

  const currentText = spec.unitization_mode === "sentence_step" ? activeUnit?.unit_text ?? "" : activeDoc?.text ?? "";
  const midpoint = Math.max(1, Math.floor((activeUnit?.unit_text ?? activeDoc?.text ?? "").length / 2));

  return (
    <section className="workspace-shell card">
      <header className="workspace-header">
        <h3>Annotator Workspace Preview</h3>
        <div className="workspace-meta">
          <span className="badge">Progress {progress}%</span>
          <span className="badge">
            Unit {activeIndex + 1}/{units.length}
          </span>
          {spec.run_mode === "ra" ? (
            <span className="badge success">Saved {savedAt ? new Date(savedAt).toLocaleTimeString() : "…"}</span>
          ) : (
            <span className="badge">Submit at end</span>
          )}
        </div>
      </header>
      <div className="workspace-body">
        <article className="document-pane" onMouseUp={onTextMouseUp}>
          <h4>{activeDoc?.doc_id}</h4>
          <p>{currentText}</p>
          {spec.unitization_mode === "target_span" && selectionText ? <div className="alert">Selected: “{selectionText}”</div> : null}
          {(spansByUnit[activeUnit?.unit_id ?? ""] ?? []).map((span, idx) => (
            <div key={`${span.ts}-${idx}`} className="span-chip">
              <span>{span.text}</span>
              <strong>{palette.find((label) => label.value === span.labelId)?.label ?? span.labelId}</strong>
              <small>{span.ts}</small>
            </div>
          ))}
        </article>
        <aside className="action-pane">
          <div className="inline-actions">
            <button onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}>Prev (P)</button>
            <button onClick={() => setActiveIndex((idx) => Math.min(units.length - 1, idx + 1))}>Next (N)</button>
          </div>
          <p className="muted">
            Shortcuts: <kbd>N</kbd> next, <kbd>P</kbd> prev.
          </p>
          <h4>Questionnaire</h4>
          {spec.questions?.map((q) => (
            <div className="card compact" key={q.question_id}>
              <strong>{q.prompt}</strong>
              {q.response_type === "free_text" ? (
                <textarea
                  value={noteByUnit[activeUnit?.unit_id ?? ""] ?? ""}
                  onChange={(e) => setNoteByUnit((curr) => ({ ...curr, [activeUnit.unit_id]: e.target.value }))}
                />
              ) : (
                <div className="palette">
                  {(q.options ?? []).map((option, idx) => (
                    <button
                      key={option.value}
                      style={{ backgroundColor: LABEL_COLORS[idx % LABEL_COLORS.length] }}
                      onClick={() => setLabelByUnit((curr) => ({ ...curr, [activeUnit.unit_id]: option.value }))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {spec.task_type === "compare" ? (
            <div className="compare-grid">
              <div className="card compact">
                <h5>Candidate A</h5>
                <p>{(activeUnit?.unit_text ?? activeDoc?.text ?? "").slice(0, midpoint)}</p>
              </div>
              <div className="card compact">
                <h5>Candidate B</h5>
                <p>{(activeUnit?.unit_text ?? activeDoc?.text ?? "").slice(midpoint)}</p>
              </div>
              <label>
                Decision
                <select
                  value={compareDecision[activeUnit?.unit_id ?? ""] ?? ""}
                  onChange={(e) => setCompareDecision((curr) => ({ ...curr, [activeUnit.unit_id]: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="A">Candidate A</option>
                  <option value="B">Candidate B</option>
                  <option value="TIE">Tie</option>
                </select>
              </label>
            </div>
          ) : null}

          {spec.unitization_mode === "target_span" ? (
            <div className="inline-actions">
              {palette.map((label) => (
                <button key={`span-${label.value}`} onClick={() => addSpan(label.value)}>
                  Tag selection as {label.label}
                </button>
              ))}
            </div>
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
  const [activeStep, setActiveStep] = useState<StudioStepKey>("create");
  const [status, setStatus] = useState("Autosave active");
  const [showPreview, setShowPreview] = useState(false);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setStatus(`Draft saved ${new Date().toLocaleTimeString()}`);
  }, [draft]);

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
  const questionValidation = useMemo(() => validateQuestions(draft.task_type, draft.questions), [draft.task_type, draft.questions]);
  const units = useMemo(() => deriveUnits(docs, draft.unitization_mode), [docs, draft.unitization_mode]);

  const compiled = useMemo(() => {
    try {
      if (!draft.study_id.trim()) throw new Error("Study ID is required.");
      if (datasetValidation.errors.length) throw new Error("Fix dataset validation errors before export.");
      if (questionValidation.length) throw new Error("Fix rubric question errors before export.");
      const spec: StudySpec = {
        study_id: draft.study_id,
        rubric_version: draft.rubric_version,
        task_type: draft.task_type,
        unitization_mode: draft.unitization_mode,
        run_mode: draft.run_mode,
        questions: toRubricQuestions(draft.questions),
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
  }, [datasetValidation.errors.length, docs, draft, questionValidation.length, units]);

  const stepState = useMemo(() => {
    const map: Record<StudioStepKey, "complete" | "in_progress" | "blocked" | "todo"> = {
      create: draft.study_name && draft.study_id ? "complete" : "blocked",
      dataset: docs.length > 0 && datasetValidation.errors.length === 0 ? "complete" : docs.length ? "blocked" : "todo",
      task: draft.task_type ? "complete" : "todo",
      unitization: draft.unitization_mode ? "complete" : "todo",
      rubric: draft.questions.length && questionValidation.length === 0 ? "complete" : "blocked",
      instructions: draft.instructions_global ? "complete" : "todo",
      runmode: draft.run_mode ? "complete" : "todo",
      workplan: draft.annotator_ids.trim() ? "complete" : "todo",
      review: compiled ? "in_progress" : "blocked"
    };
    map[activeStep] = map[activeStep] === "complete" ? "in_progress" : map[activeStep];
    return map;
  }, [activeStep, compiled, datasetValidation.errors.length, docs.length, draft, questionValidation.length]);

  const update = <K extends keyof StudioDraft>(key: K, value: StudioDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

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
    setStatus(`Exported ${Object.keys(artifacts).length} artifacts`);
  };

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const format: DatasetFormat = file.name.endsWith(".csv") ? "csv" : "jsonl";
    update("datasetFormat", format);
    update("datasetText", await readFileText(file));
    setStatus(`Loaded ${file.name}`);
  };

  const addQuestion = () => {
    const idx = draft.questions.length + 1;
    update("questions", [...draft.questions, defaultQuestionForTask(draft.task_type, idx)]);
  };

  const onTaskTypeChange = (taskType: TaskType) => {
    const transformed = draft.questions.map((q, idx) => {
      const base = defaultQuestionForTask(taskType, idx + 1);
      return {
        ...base,
        question_id: q.question_id || base.question_id,
        prompt: q.prompt || base.prompt
      };
    });
    update("task_type", taskType);
    update("questions", transformed.length ? transformed : [defaultQuestionForTask(taskType)]);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar card">
        <h1>ThoughtTagger Studio</h1>
        <p className="muted">Build a study bundle in guided steps.</p>
        <nav>
          {STEP_ORDER.map((step, idx) => (
            <button key={step.key} className={`step-link ${activeStep === step.key ? "active" : ""}`} onClick={() => setActiveStep(step.key)}>
              <span>
                {idx + 1}. {step.title}
              </span>
              <span className={classForStatus(stepState[step.key])}>{stepState[step.key]}</span>
            </button>
          ))}
        </nav>
        <div className="alert subtle">{status}</div>
      </aside>

      <section className="content">
        {globalError ? <div className="alert danger">{globalError}</div> : null}

        <section className="card">
          <h2>1. Create Study</h2>
          <div className="form-grid">
            <label>
              Study Name <input value={draft.study_name} onChange={(e) => update("study_name", e.target.value)} />
            </label>
            <label>
              Study ID <input value={draft.study_id} onChange={(e) => update("study_id", e.target.value)} />
            </label>
            <label>
              Rubric Version <input value={draft.rubric_version} onChange={(e) => update("rubric_version", e.target.value)} />
            </label>
            <label className="full">
              Description <textarea value={draft.description} onChange={(e) => update("description", e.target.value)} />
            </label>
          </div>
        </section>

        <section className="card">
          <h2>2. Upload Dataset</h2>
          <div className="inline-actions">
            <label>
              Format
              <select value={draft.datasetFormat} onChange={(e) => update("datasetFormat", e.target.value as DatasetFormat)}>
                <option value="jsonl">JSONL</option>
                <option value="csv">CSV</option>
              </select>
            </label>
            <label>
              Upload dataset<input aria-label="Upload dataset" type="file" accept=".jsonl,.csv" onChange={onUpload} />
            </label>
          </div>
          <textarea aria-label="Dataset text" value={draft.datasetText} onChange={(e) => update("datasetText", e.target.value)} />
          {datasetValidation.errors.length > 0 ? (
            <div className="alert danger">
              <strong>Dataset errors:</strong>
              <ul>{datasetValidation.errors.map((error) => <li key={error}>{error}</li>)}</ul>
            </div>
          ) : null}
          {datasetValidation.warnings.length > 0 ? (
            <div className="alert warning">
              <strong>Dataset warnings:</strong>
              <ul>{datasetValidation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </div>
          ) : null}
          <table>
            <thead>
              <tr>
                <th>doc_id</th>
                <th>text preview</th>
              </tr>
            </thead>
            <tbody>
              {docs.slice(0, 5).map((doc, index) => (
                <tr key={`${doc.doc_id}-${index}`}>
                  <td>{doc.doc_id}</td>
                  <td>{doc.text.slice(0, 90)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>3-4. Task + Unitization</h2>
          <div className="form-grid">
            <label>
              Task Type
              <select value={draft.task_type} onChange={(e) => onTaskTypeChange(e.target.value as TaskType)}>
                <option value="label">label</option>
                <option value="annotate">annotate</option>
                <option value="compare">compare</option>
              </select>
            </label>
            <label>
              Unitization
              <select value={draft.unitization_mode} onChange={(e) => update("unitization_mode", e.target.value as UnitizationMode)}>
                <option value="document">document</option>
                <option value="sentence_step">sentence_step</option>
                <option value="target_span">target_span</option>
              </select>
            </label>
          </div>
        </section>

        <section className="card">
          <div className="inline-actions spread">
            <h2>5. Rubric Questionnaire Builder</h2>
            <button onClick={addQuestion}>Add question</button>
          </div>
          <p className="muted">Define your own questionnaire like Google Forms. Question controls are constrained by task type.</p>
          {draft.questions.map((question, qIndex) => (
            <div key={question.question_id || `q-${qIndex}`} className="label-editor">
              <div className="inline-actions">
                <label>
                  Question ID
                  <input
                    value={question.question_id}
                    onChange={(e) =>
                      update(
                        "questions",
                        draft.questions.map((q, idx) => (idx === qIndex ? { ...q, question_id: e.target.value } : q))
                      )
                    }
                  />
                </label>
                <label>
                  Response type
                  <select
                    value={question.response_type}
                    onChange={(e) =>
                      update(
                        "questions",
                        draft.questions.map((q, idx) =>
                          idx === qIndex
                            ? {
                                ...q,
                                response_type: e.target.value as QuestionResponseType,
                                options:
                                  e.target.value === "free_text"
                                    ? []
                                    : q.options.length
                                      ? q.options
                                      : [
                                          { value: "opt_1", label: "Option 1", description: "" },
                                          { value: "opt_2", label: "Option 2", description: "" }
                                        ]
                              }
                            : q
                        )
                      )
                    }
                  >
                    {optionsForTask(draft.task_type).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Required
                  <select
                    value={question.required ? "yes" : "no"}
                    onChange={(e) =>
                      update(
                        "questions",
                        draft.questions.map((q, idx) => (idx === qIndex ? { ...q, required: e.target.value === "yes" } : q))
                      )
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <button onClick={() => update("questions", draft.questions.filter((_, idx) => idx !== qIndex))}>Remove question</button>
              </div>

              <label>
                Prompt
                <textarea
                  value={question.prompt}
                  onChange={(e) =>
                    update(
                      "questions",
                      draft.questions.map((q, idx) => (idx === qIndex ? { ...q, prompt: e.target.value } : q))
                    )
                  }
                />
              </label>

              <label>
                Help text
                <textarea
                  value={question.help_text}
                  onChange={(e) =>
                    update(
                      "questions",
                      draft.questions.map((q, idx) => (idx === qIndex ? { ...q, help_text: e.target.value } : q))
                    )
                  }
                />
              </label>

              {question.response_type !== "free_text" ? (
                <div>
                  <div className="inline-actions spread">
                    <strong>Options</strong>
                    <button
                      onClick={() =>
                        update(
                          "questions",
                          draft.questions.map((q, idx) =>
                            idx === qIndex
                              ? {
                                  ...q,
                                  options: [...q.options, { value: `opt_${q.options.length + 1}`, label: `Option ${q.options.length + 1}`, description: "" }]
                                }
                              : q
                          )
                        )
                      }
                    >
                      Add option
                    </button>
                  </div>
                  {question.options.map((option, optIndex) => (
                    <div key={`${option.value}-${optIndex}`} className="inline-actions">
                      <label>
                        Value
                        <input
                          value={option.value}
                          onChange={(e) =>
                            update(
                              "questions",
                              draft.questions.map((q, idx) =>
                                idx === qIndex
                                  ? {
                                      ...q,
                                      options: q.options.map((opt, oi) => (oi === optIndex ? { ...opt, value: e.target.value } : opt))
                                    }
                                  : q
                              )
                            )
                          }
                        />
                      </label>
                      <label>
                        Label
                        <input
                          value={option.label}
                          onChange={(e) =>
                            update(
                              "questions",
                              draft.questions.map((q, idx) =>
                                idx === qIndex
                                  ? {
                                      ...q,
                                      options: q.options.map((opt, oi) => (oi === optIndex ? { ...opt, label: e.target.value } : opt))
                                    }
                                  : q
                              )
                            )
                          }
                        />
                      </label>
                      <label>
                        Description
                        <input
                          value={option.description}
                          onChange={(e) =>
                            update(
                              "questions",
                              draft.questions.map((q, idx) =>
                                idx === qIndex
                                  ? {
                                      ...q,
                                      options: q.options.map((opt, oi) => (oi === optIndex ? { ...opt, description: e.target.value } : opt))
                                    }
                                  : q
                              )
                            )
                          }
                        />
                      </label>
                      <button
                        onClick={() =>
                          update(
                            "questions",
                            draft.questions.map((q, idx) =>
                              idx === qIndex ? { ...q, options: q.options.filter((_, oi) => oi !== optIndex) } : q
                            )
                          )
                        }
                      >
                        Remove option
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {questionValidation.length > 0 ? (
            <div className="alert danger">
              <strong>Rubric question errors:</strong>
              <ul>{questionValidation.map((error) => <li key={error}>{error}</li>)}</ul>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>6. Instructions</h2>
          <label>
            Global instructions<textarea value={draft.instructions_global} onChange={(e) => update("instructions_global", e.target.value)} />
          </label>
          <label>
            Task-specific instructions<textarea value={draft.instructions_task} onChange={(e) => update("instructions_task", e.target.value)} />
          </label>
        </section>

        <section className="card">
          <h2>7-8. Run Mode + Work Plan</h2>
          <div className="form-grid">
            <label>
              Run mode
              <select value={draft.run_mode} onChange={(e) => update("run_mode", e.target.value as RunMode)}>
                <option value="participant">participant</option>
                <option value="ra">ra</option>
              </select>
            </label>
            <label>
              Save policy
              <select value={draft.save_policy} onChange={(e) => update("save_policy", e.target.value as SavePolicy)}>
                <option value="submit_end">Submit at end</option>
                <option value="checkpoint">Checkpoint</option>
                <option value="autosave">Autosave</option>
              </select>
            </label>
            <label className="full">
              Annotator IDs (comma separated)
              <input value={draft.annotator_ids} onChange={(e) => update("annotator_ids", e.target.value)} />
            </label>
            <label>
              Replication k
              <input type="number" min={1} value={draft.replication_factor} onChange={(e) => update("replication_factor", Number(e.target.value || 1))} />
            </label>
            <label>
              Groups G
              <input type="number" min={1} value={draft.groups} onChange={(e) => update("groups", Number(e.target.value || 1))} />
            </label>
          </div>
        </section>

        <section className="card">
          <div className="inline-actions spread">
            <h2>9. Review & Export</h2>
            <div className="inline-actions">
              <button onClick={() => setShowPreview((curr) => !curr)}>{showPreview ? "Hide" : "Preview as Annotator"}</button>
              <button className="primary" onClick={exportBundle} disabled={!compiled}>
                Export Bundle
              </button>
            </div>
          </div>
          <ul>
            <li>Documents: {docs.length}</li>
            <li>Avg length: {docs.length ? Math.round(docs.reduce((acc, doc) => acc + doc.text.length, 0) / docs.length) : 0} chars</li>
            <li>Derived units: {units.length}</li>
            <li>Estimated workload: docs × k = {docs.length * draft.replication_factor}</li>
            <li>Estimated unit workload: units × k = {units.length * draft.replication_factor}</li>
            <li>Run mode: {draft.run_mode} ({draft.save_policy})</li>
            <li>Questions configured: {draft.questions.length}</li>
          </ul>
        </section>

        {showPreview && compiled ? <AnnotatorWorkspace spec={compiled.spec} docs={compiled.docs} units={compiled.units} /> : null}
      </section>
    </main>
  );
}
