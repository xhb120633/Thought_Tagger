import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileStudy } from "../src/index.js";

test("compiler emits manifest and templates", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.jsonl");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "demo",
      rubric_version: "v1",
      task_type: "label",
      unitization_mode: "sentence_step",
      run_mode: "ra",
      questions: [
        {
          question_id: "q1",
          prompt: "Label this unit",
          response_type: "single_select",
          options: [
            { value: "good", label: "Good" },
            { value: "bad", label: "Bad" }
          ]
        }
      ]
    })
  );
  await writeFile(dataPath, `${JSON.stringify({ doc_id: "d1", text: "A. B." })}\n`);

  await compileStudy({ specPath, datasetPath: dataPath, outDir });

  const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));
  assert.equal(manifest.document_count, 1);
  assert.equal(manifest.unit_count, 2);
});
