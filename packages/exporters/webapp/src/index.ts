import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface CompilerManifest {
  study_id: string;
  rubric_version: string;
  task_type: string;
  unitization_mode: string;
  run_mode: string;
  document_count: number;
  unit_count: number;
  build_id: string;
}

interface DerivedUnit {
  doc_id: string;
  unit_id: string;
  unit_text: string;
  [key: string]: unknown;
}

export interface ExportInput {
  compilerOutputDir: string;
  outDir: string;
}

export async function exportWebappBundle(input: ExportInput): Promise<void> {
  const manifest = JSON.parse(await readFile(join(input.compilerOutputDir, "manifest.json"), "utf8")) as CompilerManifest;
  const units = await readJsonl<DerivedUnit>(join(input.compilerOutputDir, "units.jsonl"));

  await mkdir(input.outDir, { recursive: true });
  await writeFile(join(input.outDir, "bundle.json"), JSON.stringify({ manifest, units, target: "webapp" }, null, 2));
  await writeFile(join(input.outDir, "index.html"), webappHtml(manifest.study_id));
  await writeFile(join(input.outDir, "app.js"), runtimeScript({ manifest, units, target: "webapp" }));
}

async function readJsonl<T>(filePath: string): Promise<T[]> {
  const raw = await readFile(filePath, "utf8");
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as T);
}

function webappHtml(studyId: string): string {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>ThoughtTagger ${studyId}</title></head>
  <body>
    <main id="app"></main>
    <script src="./app.js"></script>
  </body>
</html>`;
}

function runtimeScript(bundle: { manifest: CompilerManifest; units: DerivedUnit[]; target: string }): string {
  const serialized = JSON.stringify(bundle);
  return `(() => {
  const bundle = ${serialized};
  const annotationColumns = ["study_id","rubric_version","annotator_id","doc_id","unit_id","task_type","response_payload","confidence","rationale","condition_id","created_at","updated_at"];
  const eventColumns = ["event_id","timestamp","actor_id","doc_id","unit_id","event_type","event_payload"];
  const storage = globalThis.localStorage;

  function isoNow() { return new Date().toISOString(); }
  function storageKey(sessionId) { return 'thought-tagger:' + bundle.target + ':' + bundle.manifest.study_id + ':' + sessionId; }

  function createState(sessionId) {
    return { sessionId, currentIndex: 0, annotations: {}, events: [], createdAt: isoNow() };
  }

  const api = {
    target: bundle.target,
    manifest: bundle.manifest,
    units: bundle.units,
    annotationSchema: annotationColumns,
    eventSchema: eventColumns,
    state: createState('default'),
    init(sessionId = 'default') {
      this.state = this.loadProgress(sessionId) || createState(sessionId);
      this.log('session_open', this.currentUnit()?.doc_id, this.currentUnit()?.unit_id, { session_id: sessionId });
      this.saveProgress();
      return this.state;
    },
    currentUnit() { return this.units[this.state.currentIndex] ?? null; },
    setResponse(responsePayload, confidence = '', rationale = '') {
      const unit = this.currentUnit();
      if (!unit) return;
      const now = isoNow();
      const existing = this.state.annotations[unit.unit_id];
      this.state.annotations[unit.unit_id] = {
        study_id: this.manifest.study_id,
        rubric_version: this.manifest.rubric_version,
        annotator_id: '',
        doc_id: unit.doc_id,
        unit_id: unit.unit_id,
        task_type: this.manifest.task_type,
        response_payload: responsePayload,
        confidence,
        rationale,
        condition_id: '',
        created_at: existing?.created_at ?? now,
        updated_at: now
      };
      this.log('response_saved', unit.doc_id, unit.unit_id, { confidence });
      this.saveProgress();
    },
    next() {
      if (this.state.currentIndex < this.units.length - 1) this.state.currentIndex += 1;
      this.log('unit_open', this.currentUnit()?.doc_id, this.currentUnit()?.unit_id, { direction: 'next' });
      this.saveProgress();
    },
    prev() {
      if (this.state.currentIndex > 0) this.state.currentIndex -= 1;
      this.log('unit_open', this.currentUnit()?.doc_id, this.currentUnit()?.unit_id, { direction: 'prev' });
      this.saveProgress();
    },
    log(eventType, docId, unitId, payload) {
      this.state.events.push({
        event_id: String(this.state.events.length + 1) + ':' + eventType,
        timestamp: isoNow(),
        actor_id: this.state.sessionId,
        doc_id: docId ?? '',
        unit_id: unitId ?? '',
        event_type: eventType,
        event_payload: payload
      });
    },
    saveProgress() {
      if (!storage) return;
      storage.setItem(storageKey(this.state.sessionId), JSON.stringify(this.state));
    },
    loadProgress(sessionId = 'default') {
      if (!storage) return null;
      const raw = storage.getItem(storageKey(sessionId));
      return raw ? JSON.parse(raw) : null;
    },
    exportAnnotationTable(annotatorId = 'anonymous') {
      return Object.values(this.state.annotations).map((row) => ({ ...row, annotator_id: annotatorId }));
    },
    exportEventLog() { return [...this.state.events]; },
    mount(root) {
      if (!root || typeof document === 'undefined') return;
      const render = () => {
        const unit = this.currentUnit();
        const saved = unit ? this.state.annotations[unit.unit_id] : null;
        root.innerHTML = '<h1>ThoughtTagger (' + this.target + ')</h1>' +
          '<p><strong>Study:</strong> ' + this.manifest.study_id + '</p>' +
          '<p><strong>Unit:</strong> ' + (this.state.currentIndex + 1) + ' / ' + this.units.length + '</p>' +
          '<pre id="unit-text"></pre>' +
          '<textarea id="response" rows="4" cols="60"></textarea><br />' +
          '<input id="confidence" placeholder="confidence" /> <input id="rationale" placeholder="rationale" />' +
          '<div><button id="prev">Prev</button> <button id="save">Save</button> <button id="next">Next</button></div>';
        root.querySelector('#unit-text').textContent = unit?.unit_text ?? 'No unit';
        root.querySelector('#response').value = saved?.response_payload ?? '';
        root.querySelector('#confidence').value = saved?.confidence ?? '';
        root.querySelector('#rationale').value = saved?.rationale ?? '';
        root.querySelector('#save').onclick = () => {
          this.setResponse(root.querySelector('#response').value, root.querySelector('#confidence').value, root.querySelector('#rationale').value);
        };
        root.querySelector('#next').onclick = () => { this.next(); render(); };
        root.querySelector('#prev').onclick = () => { this.prev(); render(); };
      };
      this.init(this.state.sessionId);
      render();
    }
  };

  globalThis.ThoughtTaggerApp = api;
  if (typeof document !== 'undefined') api.mount(document.getElementById('app'));
})();`;
}
