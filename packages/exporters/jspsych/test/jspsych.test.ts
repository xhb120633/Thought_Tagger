import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import { exportJsPsychBundle } from "../src/index.js";

test("jspsych exporter emits runnable bundle with timeline and schemas", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-jspsych-"));
  const compilerOut = join(dir, "compiler");
  const exportOut = join(dir, "export");
  await mkdir(compilerOut, { recursive: true });
  await writeFile(join(compilerOut, "manifest.json"), JSON.stringify({ study_id: "demo", rubric_version: "v1", task_type: "label" }));
  await writeFile(join(compilerOut, "units.jsonl"), `${JSON.stringify({ doc_id: "d1", unit_id: "u1", unit_text: "unit" })}\n`);

  await exportJsPsychBundle({ compilerOutputDir: compilerOut, outDir: exportOut });

  const script = await readFile(join(exportOut, "app.js"), "utf8");
  const storage = new Map<string, string>();
  const context: Record<string, unknown> = {
    localStorage: { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => void storage.set(k, v) },
    globalThis: {}
  };
  context.globalThis = context;
  vm.runInNewContext(script, context);
  const app = (context as { ThoughtTaggerApp: any }).ThoughtTaggerApp;
  app.init("s1");
  app.setResponse("accept", "1", "ok");

  assert.equal(app.toJsPsychTimeline().length, 1);
  assert.equal(app.exportAnnotationTable("ann").length, 1);
  assert.equal(Object.keys(app.exportEventLog()[0]).join(","), Array.from(app.eventSchema).join(","));
});
