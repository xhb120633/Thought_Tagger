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
  assert.equal(manifest.question_count, 0);
  assert.equal(manifest.conditional_question_count, 0);
  assert.match(manifest.build_id, /^[0-9a-f]{8}$/);

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

test("compiler correctly parses quoted CSV fields and meta columns", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.csv");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "demo",
      rubric_version: "v1",
      task_type: "label",
      unitization_mode: "document",
      run_mode: "ra"
    })
  );

  await writeFile(
    dataPath,
    [
      "doc_id,text,meta.source,meta.notes",
      'd1,"Hello, world.",paper,"quote ""A"""',
      'd2,"Another line",forum,'
    ].join("\n")
  );

  await compileStudy({ specPath, datasetPath: dataPath, outDir });

  const units = (await readFile(join(outDir, "units.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));

  assert.equal(units.length, 2);
  assert.equal(units[0].unit_text, "Hello, world.");
  assert.equal(units[1].unit_text, "Another line");
});



test("compiler manifest includes conditional question counts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.jsonl");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "demo_conditional",
      rubric_version: "v1",
      task_type: "label",
      unitization_mode: "document",
      run_mode: "ra",
      questions: [
        {
          question_id: "q1",
          prompt: "Primary",
          response_type: "single_select",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" }
          ]
        },
        {
          question_id: "q2",
          prompt: "Why no?",
          response_type: "single_select",
          options: [
            { value: "reason_1", label: "Reason 1" },
            { value: "reason_2", label: "Reason 2" }
          ],
          show_if: {
            question_id: "q1",
            equals: "no"
          }
        }
      ]
    })
  );
  await writeFile(dataPath, `${JSON.stringify({ doc_id: "d1", text: "Hello." })}\n`);

  await compileStudy({ specPath, datasetPath: dataPath, outDir });

  const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));
  assert.equal(manifest.question_count, 2);
  assert.equal(manifest.conditional_question_count, 1);
});

test("compiler output manifest is deterministic for identical inputs", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.jsonl");
  const outOne = join(dir, "out1");
  const outTwo = join(dir, "out2");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "stable",
      rubric_version: "v1",
      task_type: "annotate",
      unitization_mode: "sentence_step",
      run_mode: "participant"
    })
  );
  await writeFile(dataPath, `${JSON.stringify({ doc_id: "d1", text: "Stable. Build." })}\n`);

  await compileStudy({ specPath, datasetPath: dataPath, outDir: outOne });
  await compileStudy({ specPath, datasetPath: dataPath, outDir: outTwo });

  const manifestOne = await readFile(join(outOne, "manifest.json"), "utf8");
  const manifestTwo = await readFile(join(outTwo, "manifest.json"), "utf8");
  assert.equal(manifestOne, manifestTwo);
});


test("compiler emits compare_context.jsonl for inline_meta compare mode", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.csv");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "cmp_inline",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare_pairing: {
        mode: "single_file",
        policy: "by_index"
      },
      compare_context: {
        mode: "inline_meta",
        context_meta_key: "shared_context"
      }
    })
  );
  await writeFile(dataPath, ["doc_id,text,meta.shared_context", "a1,A output,Topic 1", "b1,B output,Topic 1"].join("\n"));

  await compileStudy({ specPath, datasetPath: dataPath, outDir });

  const rows = (await readFile(join(outDir, "compare_context.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));

  assert.equal(rows.length, 2);
  assert.equal(rows[0].pair_id, "pair_1");
  assert.equal(rows[0].context, "Topic 1");
});

test("compiler emits compare_context.jsonl for sidecar compare mode", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.csv");
  const sidecarPath = join(dir, "context.jsonl");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "cmp_sidecar",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare_pairing: {
        mode: "single_file",
        policy: "by_index"
      },
      compare_context: {
        mode: "sidecar",
        sidecar_pair_id_field: "pair_id",
        sidecar_context_field: "context"
      }
    })
  );
  await writeFile(dataPath, ["doc_id,text", "a1,A output", "b1,B output"].join("\n"));
  await writeFile(sidecarPath, `${JSON.stringify({ pair_id: "pair_1", context: "Shared prompt" })}\n`);

  await compileStudy({ specPath, datasetPath: dataPath, outDir, contextSidecarPath: sidecarPath });

  const rows = (await readFile(join(outDir, "compare_context.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));

  assert.equal(rows.length, 2);
  assert.equal(rows[0].context, "Shared prompt");
});


test("compiler supports two-file by_index compare pairing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPathA = join(dir, "dataset_a.csv");
  const dataPathB = join(dir, "dataset_b.csv");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "cmp_2f",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare_pairing: {
        mode: "two_file",
        policy: "by_index"
      }
    })
  );
  await writeFile(dataPathA, ["doc_id,text", "a1,Output A1", "a2,Output A2"].join("\n"));
  await writeFile(dataPathB, ["doc_id,text", "b1,Output B1", "b2,Output B2"].join("\n"));

  await compileStudy({ specPath, datasetPath: dataPathA, datasetPathB: dataPathB, outDir });

  const units = (await readFile(join(outDir, "units.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));

  assert.equal(units.length, 4);
  assert.equal(units[0].pair_id, "pair_1");
  assert.equal(units[1].pair_id, "pair_1");
  assert.equal(units[0].meta.compare_slot, "A");
  assert.equal(units[1].meta.compare_slot, "B");
});

test("compiler supports single-file random compare pairing deterministically", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.csv");
  const outOne = join(dir, "out1");
  const outTwo = join(dir, "out2");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "cmp_rand",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare_pairing: {
        mode: "single_file",
        policy: "random_pair",
        seed: "seed-123"
      }
    })
  );
  await writeFile(dataPath, ["doc_id,text", "a1,Output 1", "a2,Output 2", "a3,Output 3", "a4,Output 4"].join("\n"));

  await compileStudy({ specPath, datasetPath: dataPath, outDir: outOne });
  await compileStudy({ specPath, datasetPath: dataPath, outDir: outTwo });

  const unitsOne = await readFile(join(outOne, "units.jsonl"), "utf8");
  const unitsTwo = await readFile(join(outTwo, "units.jsonl"), "utf8");
  assert.equal(unitsOne, unitsTwo);
});

test("compiler rejects two-file compare when dataset lengths differ", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPathA = join(dir, "dataset_a.csv");
  const dataPathB = join(dir, "dataset_b.csv");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "cmp_err",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare_pairing: {
        mode: "two_file",
        policy: "random_pair"
      }
    })
  );
  await writeFile(dataPathA, ["doc_id,text", "a1,Output A1", "a2,Output A2"].join("\n"));
  await writeFile(dataPathB, ["doc_id,text", "b1,Output B1"].join("\n"));

  await assert.rejects(() => compileStudy({ specPath, datasetPath: dataPathA, datasetPathB: dataPathB, outDir }), /equal dataset lengths/);
});
