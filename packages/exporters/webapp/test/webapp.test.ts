import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import { exportWebappBundle } from "../src/index.js";

test("webapp exporter emits runnable bundle with persistence and export schema", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-webapp-"));
  const compilerOut = join(dir, "compiler");
  const exportOut = join(dir, "export");

  await mkdir(compilerOut, { recursive: true });
  await writeFile(join(compilerOut, "manifest.json"), JSON.stringify({
    study_id: "demo",
    rubric_version: "v1",
    task_type: "label",
    unitization_mode: "sentence_step",
    run_mode: "ra",
    document_count: 1,
    unit_count: 2,
    build_id: "abc12345"
  }));
  await writeFile(join(compilerOut, "units.jsonl"), `${JSON.stringify({ doc_id: "d1", unit_id: "u1", unit_text: "hello" })}\n`);

  await exportWebappBundle({ compilerOutputDir: compilerOut, outDir: exportOut });

  const html = await readFile(join(exportOut, "index.html"), "utf8");
  assert.match(html, /script src="\.\/app\.js"/);

  const script = await readFile(join(exportOut, "app.js"), "utf8");
  const store = new Map<string, string>();
  const context = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v)
    },
    globalThis: {} as Record<string, unknown>
  } as Record<string, unknown>;
  context.globalThis = context;
  vm.runInNewContext(script, context);

  const app = (context as { ThoughtTaggerApp: any }).ThoughtTaggerApp;
  app.init("session-a");
  app.setResponse("yes", "0.9", "clear");
  const rows = app.exportAnnotationTable("ann1");
  const events = app.exportEventLog();

  assert.equal(rows.length, 1);
  assert.equal(Object.keys(rows[0]).join(","), Array.from(app.annotationSchema).join(","));
  assert.equal(Object.keys(events[0]).join(","), Array.from(app.eventSchema).join(","));
  assert.ok(app.loadProgress("session-a"));
});
