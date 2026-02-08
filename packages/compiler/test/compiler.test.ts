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
      run_mode: "ra"
    })
  );
  await writeFile(dataPath, `${JSON.stringify({ doc_id: "d1", text: "A. B." })}\n`);

  await compileStudy({ specPath, datasetPath: dataPath, outDir });

  const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));
  assert.equal(manifest.document_count, 1);
  assert.equal(manifest.unit_count, 2);

  const annotationTemplate = await readFile(join(outDir, "annotation_template.csv"), "utf8");
  assert.match(annotationTemplate.split(/\r?\n/)[0] ?? "", /confidence,rationale,condition_id/);
});

test("compiler emits assignment manifest when workplan is provided", async () => {
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
      workplan: {
        annotator_ids: ["ann_a", "ann_b"],
        replication_factor: 1,
        assignment_strategy: "round_robin"
      }
    })
  );
  await writeFile(dataPath, `${JSON.stringify({ doc_id: "d1", text: "A. B." })}\n`);

  await compileStudy({ specPath, datasetPath: dataPath, outDir });

  const assignmentRows = (await readFile(join(outDir, "assignment_manifest.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));

  assert.equal(assignmentRows.length, 2);
  assert.equal(assignmentRows[0].annotator_id, "ann_a");
  assert.equal(assignmentRows[1].annotator_id, "ann_b");
});
