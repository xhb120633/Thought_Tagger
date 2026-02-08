import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface CompilerManifest { study_id: string; rubric_version: string; task_type: string; }
interface DerivedUnit { doc_id: string; unit_id: string; unit_text: string; [key: string]: unknown; }
export interface ExportInput { compilerOutputDir: string; outDir: string; }

export async function exportJsPsychBundle(input: ExportInput): Promise<void> {
  const manifest = JSON.parse(await readFile(join(input.compilerOutputDir, "manifest.json"), "utf8")) as CompilerManifest;
  const units = (await readFile(join(input.compilerOutputDir, "units.jsonl"), "utf8"))
    .split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as DerivedUnit);

  await mkdir(input.outDir, { recursive: true });
  await writeFile(join(input.outDir, "bundle.json"), JSON.stringify({ manifest, units, target: "jspsych" }, null, 2));
  await writeFile(join(input.outDir, "index.html"), `<!doctype html><html><body><div id="app"></div><script src="./app.js"></script></body></html>`);
  await writeFile(join(input.outDir, "app.js"), `(() => {
  const bundle = ${JSON.stringify({ manifest, units, target: "jspsych" })};
  const key = (sid) => 'thought-tagger:jspsych:' + bundle.manifest.study_id + ':' + sid;
  const now = () => new Date().toISOString();
  const store = globalThis.localStorage;
  const app = {
    annotationSchema: ["study_id","rubric_version","annotator_id","doc_id","unit_id","task_type","response_payload","confidence","rationale","condition_id","created_at","updated_at"],
    eventSchema: ["event_id","timestamp","actor_id","doc_id","unit_id","event_type","event_payload"],
    state: { sessionId: 'default', currentIndex: 0, annotations: {}, events: [] },
    init(sessionId = 'default') { this.state = this.loadProgress(sessionId) || { sessionId, currentIndex: 0, annotations: {}, events: [] }; return this.state; },
    currentUnit() { return bundle.units[this.state.currentIndex] ?? null; },
    setResponse(responsePayload, confidence = '', rationale = '') {
      const unit = this.currentUnit(); if (!unit) return;
      const old = this.state.annotations[unit.unit_id];
      this.state.annotations[unit.unit_id] = { study_id: bundle.manifest.study_id, rubric_version: bundle.manifest.rubric_version, annotator_id: '', doc_id: unit.doc_id, unit_id: unit.unit_id, task_type: bundle.manifest.task_type, response_payload: responsePayload, confidence, rationale, condition_id: '', created_at: old?.created_at ?? now(), updated_at: now() };
      this.state.events.push({ event_id: String(this.state.events.length + 1), timestamp: now(), actor_id: this.state.sessionId, doc_id: unit.doc_id, unit_id: unit.unit_id, event_type: 'response_saved', event_payload: { confidence } });
      this.saveProgress();
    },
    next() { if (this.state.currentIndex < bundle.units.length - 1) this.state.currentIndex += 1; this.saveProgress(); },
    saveProgress() { if (store) store.setItem(key(this.state.sessionId), JSON.stringify(this.state)); },
    loadProgress(sessionId = 'default') { return store ? JSON.parse(store.getItem(key(sessionId)) || 'null') : null; },
    exportAnnotationTable(annotatorId = 'anonymous') { return Object.values(this.state.annotations).map((r) => ({ ...r, annotator_id: annotatorId })); },
    exportEventLog() { return [...this.state.events]; },
    toJsPsychTimeline() { return [{ type: 'survey-text', preamble: 'ThoughtTagger study ' + bundle.manifest.study_id, data: { manifest: bundle.manifest } }]; },
    mount(root) {
      if (!root || typeof document === 'undefined') return;
      this.init(this.state.sessionId);
      const u = this.currentUnit();
      root.innerHTML = '<h1>ThoughtTagger jsPsych Export</h1><pre>' + (u?.unit_text || '') + '</pre>';
    }
  };
  globalThis.ThoughtTaggerApp = app;
  if (typeof document !== 'undefined') app.mount(document.getElementById('app'));
})();`);
}
