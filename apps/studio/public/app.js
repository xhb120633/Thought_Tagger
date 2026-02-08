const defaults = {
  spec: {
    study_id: "sentence_labeling_demo",
    rubric_version: "v1",
    task_type: "label",
    unitization_mode: "sentence_step",
    run_mode: "ra",
    questions: [
      {
        question_id: "q_quality",
        prompt: "How correct is this reasoning step?",
        response_type: "single_select",
        required: true,
        options: [
          { value: "correct", label: "Correct" },
          { value: "partly_correct", label: "Partly correct" },
          { value: "incorrect", label: "Incorrect" }
        ]
      }
    ]
  },
  dataset: `{"doc_id":"doc_001","text":"I solved the first step. Then I checked my answer."}\n{"doc_id":"doc_002","text":"This approach failed. I revised the equation."}`
};

const state = {
  studyRuntimeId: null,
  spec: null,
  units: [],
  documents: [],
  docMap: {},
  annotatorId: "",
  started: false,
  currentIdx: 0,
  responses: {},
  events: []
};

const el = {
  setupError: document.getElementById("setup-error"),
  setupResult: document.getElementById("setup-result"),
  specInput: document.getElementById("spec-input"),
  datasetInput: document.getElementById("dataset-input"),
  annotatorView: document.getElementById("annotator-view"),
  annotatorError: document.getElementById("annotator-error"),
  annotatorId: document.getElementById("annotator-id"),
  sessionMeta: document.getElementById("session-meta"),
  progress: document.getElementById("progress"),
  docContext: document.getElementById("doc-context"),
  unitText: document.getElementById("unit-text"),
  questions: document.getElementById("questions")
};

el.specInput.value = JSON.stringify(defaults.spec, null, 2);
el.datasetInput.value = defaults.dataset;

function storageKey() {
  return `tt_session:${state.studyRuntimeId}:${state.annotatorId}`;
}

function currentUnit() {
  return state.units[state.currentIdx];
}

function pushEvent(type, payload = {}) {
  state.events.push({
    event_id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    actor_id: state.annotatorId,
    doc_id: currentUnit()?.doc_id ?? null,
    unit_id: currentUnit()?.unit_id ?? null,
    event_type: type,
    event_payload: payload
  });
}

function autoSaveLocal() {
  if (!state.started) return;
  const snapshot = {
    study_id: state.spec.study_id,
    studyRuntimeId: state.studyRuntimeId,
    annotator_id: state.annotatorId,
    currentIdx: state.currentIdx,
    responses: state.responses,
    events: state.events
  };
  localStorage.setItem(storageKey(), JSON.stringify(snapshot));
}

function loadLocalSession() {
  const raw = localStorage.getItem(storageKey());
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.currentIdx = parsed.currentIdx ?? 0;
    state.responses = parsed.responses ?? {};
    state.events = parsed.events ?? [];
  } catch {
    // ignore
  }
}

function setError(node, message) {
  node.textContent = message || "";
}

function renderQuestion(question, answer, onChange) {
  const wrap = document.createElement("div");
  wrap.className = "question";

  const title = document.createElement("h4");
  title.textContent = question.prompt;
  wrap.appendChild(title);

  if (question.response_type === "free_text") {
    const ta = document.createElement("textarea");
    ta.value = typeof answer === "string" ? answer : "";
    ta.placeholder = question.placeholder || "Enter annotation...";
    ta.addEventListener("input", () => onChange(ta.value));
    wrap.appendChild(ta);
    return wrap;
  }

  const optionRow = document.createElement("div");
  optionRow.className = "option-row";
  for (const opt of question.options || []) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "secondary";

    let selected = false;
    if (question.response_type === "multi_select") {
      selected = Array.isArray(answer) && answer.includes(opt.value);
    } else {
      selected = answer === opt.value;
    }
    b.textContent = selected ? `✓ ${opt.label}` : opt.label;

    b.addEventListener("click", () => {
      if (question.response_type === "multi_select") {
        const existing = Array.isArray(answer) ? [...answer] : [];
        const idx = existing.indexOf(opt.value);
        if (idx >= 0) existing.splice(idx, 1); else existing.push(opt.value);
        onChange(existing);
      } else {
        onChange(opt.value);
      }
    });
    optionRow.appendChild(b);
  }
  wrap.appendChild(optionRow);

  if (question.response_type === "choice_with_rationale") {
    const rational = document.createElement("textarea");
    rational.placeholder = "Rationale";
    rational.value = answer?.rationale || "";
    rational.addEventListener("input", () => onChange({ ...answer, rationale: rational.value }));
    wrap.appendChild(rational);
  }

  return wrap;
}

function renderWorkspace() {
  if (!state.started) return;
  const unit = currentUnit();
  const doc = state.docMap[unit.doc_id];

  el.progress.textContent = `Unit ${state.currentIdx + 1}/${state.units.length}`;
  el.unitText.textContent = unit.unit_text;
  el.docContext.textContent = `${doc.text.slice(0, unit.char_start)}[[${doc.text.slice(unit.char_start, unit.char_end)}]]${doc.text.slice(unit.char_end)}`;
  el.questions.innerHTML = "";

  const unitResp = state.responses[unit.unit_id] || {};

  for (const q of state.spec.questions) {
    const qNode = renderQuestion(q, unitResp[q.question_id], (value) => {
      if (!state.responses[unit.unit_id]) state.responses[unit.unit_id] = {};
      state.responses[unit.unit_id][q.question_id] = value;
      pushEvent("response_change", { question_id: q.question_id });
      autoSaveLocal();
      renderWorkspace();
    });
    el.questions.appendChild(qNode);
  }
}

async function createStudy() {
  setError(el.setupError, "");
  try {
    const spec = JSON.parse(el.specInput.value);
    const datasetJsonl = el.datasetInput.value;

    const res = await fetch("/api/studies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ spec, datasetJsonl })
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Create study failed");

    const studyRes = await fetch(`/api/studies/${payload.studyRuntimeId}`);
    const studyData = await studyRes.json();

    state.studyRuntimeId = payload.studyRuntimeId;
    state.spec = studyData.spec;
    state.units = studyData.units;
    state.documents = studyData.documents;
    state.docMap = Object.fromEntries(state.documents.map((d) => [d.doc_id, d]));

    el.setupResult.textContent = JSON.stringify(payload.manifest, null, 2);
    document.getElementById("annotator-view").classList.remove("hidden");
    el.sessionMeta.textContent = `Study runtime ready: ${state.studyRuntimeId} • task=${state.spec.task_type} • run_mode=${state.spec.run_mode}`;
  } catch (error) {
    setError(el.setupError, error instanceof Error ? error.message : String(error));
  }
}

function startSession() {
  setError(el.annotatorError, "");
  const annotatorId = el.annotatorId.value.trim();
  if (!annotatorId) {
    setError(el.annotatorError, "Annotator ID is required.");
    return;
  }
  state.annotatorId = annotatorId;
  state.started = true;
  state.currentIdx = 0;
  state.responses = {};
  state.events = [];
  loadLocalSession();
  pushEvent("session_start");
  autoSaveLocal();
  renderWorkspace();
}

async function saveSession() {
  if (!state.started) return setError(el.annotatorError, "Start a session first.");
  const payload = {
    study_id: state.spec.study_id,
    studyRuntimeId: state.studyRuntimeId,
    annotator_id: state.annotatorId,
    responses: state.responses,
    events: state.events,
    saved_at: new Date().toISOString()
  };
  const res = await fetch("/api/sessions/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) return setError(el.annotatorError, data.error || "Save failed");
  el.sessionMeta.textContent = `Saved to ${data.savedTo}`;
}

function exportSession() {
  if (!state.started) return;
  const payload = {
    manifest: {
      study_id: state.spec.study_id,
      rubric_version: state.spec.rubric_version,
      annotator_id: state.annotatorId,
      runtime_id: state.studyRuntimeId
    },
    responses: state.responses,
    events: state.events
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `session_${state.spec.study_id}_${state.annotatorId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function move(delta) {
  if (!state.started) return;
  state.currentIdx = Math.max(0, Math.min(state.units.length - 1, state.currentIdx + delta));
  pushEvent("navigate", { current_idx: state.currentIdx });
  autoSaveLocal();
  renderWorkspace();
}

document.getElementById("create-study-btn").addEventListener("click", createStudy);
document.getElementById("start-session-btn").addEventListener("click", startSession);
document.getElementById("save-session-btn").addEventListener("click", saveSession);
document.getElementById("export-session-btn").addEventListener("click", exportSession);
document.getElementById("prev-btn").addEventListener("click", () => move(-1));
document.getElementById("next-btn").addEventListener("click", () => move(1));
