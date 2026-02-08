import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DerivedUnit, StudySpec } from "@thought-tagger/core";

export interface SessionEvent {
  event_id: string;
  timestamp: string;
  actor_id: string;
  doc_id: string;
  unit_id: string | null;
  event_type: string;
  event_payload: Record<string, unknown>;
}

export interface AnnotationRecord {
  study_id: string;
  rubric_version: string;
  annotator_id: string;
  doc_id: string;
  unit_id: string;
  task_type: StudySpec["task_type"];
  response_payload: string;
  confidence: string;
  rationale: string;
  condition_id: string;
  created_at: string;
  updated_at: string;
}

export function runLinearSession(
  spec: StudySpec,
  units: DerivedUnit[],
  annotatorId: string,
  responseFactory: (unit: DerivedUnit, index: number) => Record<string, unknown>
): { annotations: AnnotationRecord[]; events: SessionEvent[] } {
  const events: SessionEvent[] = [];
  const annotations: AnnotationRecord[] = [];

  for (let i = 0; i < units.length; i += 1) {
    const unit = units[i];
    const openedAt = new Date().toISOString();
    const response = responseFactory(unit, i);
    const submittedAt = new Date().toISOString();

    events.push({
      event_id: `${unit.unit_id}:open:${i}`,
      timestamp: openedAt,
      actor_id: annotatorId,
      doc_id: unit.doc_id,
      unit_id: unit.unit_id,
      event_type: "unit_open",
      event_payload: { index: i }
    });

    annotations.push({
      study_id: spec.study_id,
      rubric_version: spec.rubric_version,
      annotator_id: annotatorId,
      doc_id: unit.doc_id,
      unit_id: unit.unit_id,
      task_type: spec.task_type,
      response_payload: JSON.stringify(response),
      confidence: "",
      rationale: "",
      condition_id: "",
      created_at: submittedAt,
      updated_at: submittedAt
    });

    events.push({
      event_id: `${unit.unit_id}:submit:${i}`,
      timestamp: submittedAt,
      actor_id: annotatorId,
      doc_id: unit.doc_id,
      unit_id: unit.unit_id,
      event_type: "unit_submit",
      event_payload: response
    });
  }

  events.push({
    event_id: `session_complete:${annotatorId}`,
    timestamp: new Date().toISOString(),
    actor_id: annotatorId,
    doc_id: units[0]?.doc_id ?? "",
    unit_id: null,
    event_type: "session_complete",
    event_payload: { total_units: units.length }
  });

  return { annotations, events };
}

export async function writeSessionBundle(outDir: string, spec: StudySpec, units: DerivedUnit[]): Promise<void> {
  const webappDir = join(outDir, "webapp");
  await mkdir(webappDir, { recursive: true });

  await writeFile(join(webappDir, "study-bundle.json"), `${JSON.stringify({ spec, units }, null, 2)}\n`, "utf8");
  await writeFile(join(webappDir, "styles.css"), WEBAPP_STYLES, "utf8");
  await writeFile(join(webappDir, "app.js"), WEBAPP_SCRIPT, "utf8");
  await writeFile(join(webappDir, "index.html"), WEBAPP_HTML, "utf8");
}

const WEBAPP_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ThoughtTagger Local Annotator</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="./app.js"></script>
  </body>
</html>
`;

const WEBAPP_STYLES = `body { font-family: Arial, sans-serif; margin: 0; background: #f4f6fb; color: #13243b; }
main { max-width: 900px; margin: 0 auto; padding: 24px; }
.panel { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
textarea, input { width: 100%; margin-top: 8px; margin-bottom: 12px; padding: 10px; box-sizing: border-box; }
button { border: 0; border-radius: 6px; padding: 10px 14px; background: #315efb; color: #fff; cursor: pointer; }
.meta { color: #5f6c82; font-size: 13px; }
.actions { display: flex; gap: 8px; }
pre { white-space: pre-wrap; background: #eef2ff; padding: 12px; border-radius: 6px; }
`;

const WEBAPP_SCRIPT = `
const app = document.getElementById("app");
const state = { bundle: null, annotatorId: "", index: 0, annotations: [], events: [] };
const now = () => new Date().toISOString();

function addEvent(unit, eventType, payload) {
  state.events.push({
    event_id: (unit ? unit.unit_id : "session") + ":" + eventType + ":" + state.events.length,
    timestamp: now(),
    actor_id: state.annotatorId,
    doc_id: unit ? unit.doc_id : "",
    unit_id: unit ? unit.unit_id : null,
    event_type: eventType,
    event_payload: payload
  });
}

function annotationRow(unit, responsePayload) {
  return {
    study_id: state.bundle.spec.study_id,
    rubric_version: state.bundle.spec.rubric_version,
    annotator_id: state.annotatorId,
    doc_id: unit.doc_id,
    unit_id: unit.unit_id,
    task_type: state.bundle.spec.task_type,
    response_payload: JSON.stringify(responsePayload),
    confidence: "",
    rationale: "",
    condition_id: "",
    created_at: now(),
    updated_at: now()
  };
}

function download(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  return '"' + String(value ?? "").replaceAll('"', '""') + '"';
}

function toCsv(rows) {
  const header = ["study_id","rubric_version","annotator_id","doc_id","unit_id","task_type","response_payload","confidence","rationale","condition_id","created_at","updated_at"];
  const lines = [header.join(",")];
  rows.forEach((row) => {
    lines.push(header.map((field) => csvEscape(row[field])).join(","));
  });
  return lines.join("\\n") + "\\n";
}

function renderFinished() {
  app.innerHTML = '<section class="panel"><h1>Session complete</h1><p>You completed ' + state.annotations.length + ' unit(s).</p><div class="actions"><button id="download-annotations">Download annotation_results.csv</button><button id="download-events">Download event_log.jsonl</button></div></section>';
  document.getElementById("download-annotations").onclick = () => download("annotation_results.csv", toCsv(state.annotations));
  document.getElementById("download-events").onclick = () => download("event_log.jsonl", state.events.map((row) => JSON.stringify(row)).join("\\n") + "\\n");
}

function renderUnit() {
  const unit = state.bundle.units[state.index];
  if (!unit) {
    addEvent(null, "session_complete", { total_units: state.annotations.length });
    renderFinished();
    return;
  }

  addEvent(unit, "unit_open", { index: state.index });
  app.innerHTML = '<section class="panel"><h1>' + state.bundle.spec.study_id + '</h1><p class="meta">Unit ' + (state.index + 1) + ' / ' + state.bundle.units.length + ' · ' + unit.unit_id + '</p><pre>' + unit.unit_text + '</pre><label>Response</label><textarea id="response" rows="5" placeholder="Enter annotation response"></textarea><button id="submit">Submit & next</button></section>';

  document.getElementById("submit").onclick = () => {
    const text = document.getElementById("response").value.trim();
    if (!text) {
      alert("Response is required");
      return;
    }
    const payload = { text };
    state.annotations.push(annotationRow(unit, payload));
    addEvent(unit, "unit_submit", payload);
    state.index += 1;
    renderUnit();
  };
}

function renderStart() {
  app.innerHTML = '<section class="panel"><h1>ThoughtTagger Local Annotator</h1><p>Run one complete local annotation session from compiled bundle outputs.</p><label>Annotator ID</label><input id="annotator" placeholder="annotator_01" /><button id="start">Start session</button></section>';
  document.getElementById("start").onclick = () => {
    const value = document.getElementById("annotator").value.trim();
    if (!value) {
      alert("Annotator ID is required");
      return;
    }
    state.annotatorId = value;
    renderUnit();
  };
}

fetch("./study-bundle.json")
  .then((res) => res.json())
  .then((bundle) => {
    state.bundle = bundle;
    renderStart();
  })
  .catch((err) => {
    app.innerHTML = '<section class="panel"><h1>Failed to load bundle</h1><pre>' + String(err) + '</pre></section>';
  });
`;
