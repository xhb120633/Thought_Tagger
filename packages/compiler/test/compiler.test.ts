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
  assert.equal(manifest.compare_shared_context_mode, "none");
  assert.equal(manifest.shared_context_unit_count, 0);
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

test("compiler emits compare_context artifact for inline compare shared context mode", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.csv");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "compare_context",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare: {
        shared_context_mode: "inline_meta",
        shared_context_field: "shared_context"
      }
    })
  );

  await writeFile(
    dataPath,
    [
      "doc_id,text,meta.shared_context",
      'd1,"A vs B answer", "Prompt: Summarize the paragraph"',
      'd2,"Another pair", "Prompt: Explain the code"'
    ].join("\n")
  );

  await compileStudy({ specPath, datasetPath: dataPath, outDir });

  const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));
  assert.equal(manifest.compare_shared_context_mode, "inline_meta");
  assert.equal(manifest.shared_context_unit_count, 2);

  const contextRows = (await readFile(join(outDir, "compare_context.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));

  assert.equal(contextRows.length, 2);
  assert.equal(contextRows[0].shared_context, "Prompt: Summarize the paragraph");
});

test("compiler fails compare shared context mode when required metadata is missing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.csv");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "compare_context_missing",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare: {
        shared_context_mode: "inline_meta",
        shared_context_field: "shared_context"
      }
    })
  );

  await writeFile(
    dataPath,
    [
      "doc_id,text,meta.other",
      'd1,"A vs B answer", "different field"'
    ].join("\n")
  );

  await assert.rejects(
    compileStudy({ specPath, datasetPath: dataPath, outDir }),
    /missing required meta.shared_context/
  );
});



test("compiler emits compare_context artifact for sidecar_jsonl mode", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.csv");
  const sidecarPath = join(dir, "shared_context.jsonl");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "compare_context_sidecar",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare: {
        shared_context_mode: "sidecar_jsonl",
        shared_context_sidecar_path: "./shared_context.jsonl"
      }
    })
  );

  await writeFile(
    dataPath,
    [
      "doc_id,text",
      'd1,"A vs B answer"',
      'd2,"Another pair"'
    ].join("\n")
  );

  await writeFile(
    sidecarPath,
    [
      JSON.stringify({ doc_id: "d1", shared_context: "Prompt one" }),
      JSON.stringify({ doc_id: "d2", shared_context: "Prompt two" })
    ].join("\n")
  );

  await compileStudy({ specPath, datasetPath: dataPath, outDir });

  const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));
  assert.equal(manifest.compare_shared_context_mode, "sidecar_jsonl");
  assert.equal(manifest.shared_context_unit_count, 2);

  const contextRows = (await readFile(join(outDir, "compare_context.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));

  assert.equal(contextRows[1].shared_context, "Prompt two");
});

test("compiler fails sidecar_jsonl mode when sidecar is missing required doc", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  const specPath = join(dir, "spec.json");
  const dataPath = join(dir, "dataset.csv");
  const sidecarPath = join(dir, "shared_context.jsonl");
  const outDir = join(dir, "out");

  await writeFile(
    specPath,
    JSON.stringify({
      study_id: "compare_context_sidecar_missing_doc",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare: {
        shared_context_mode: "sidecar_jsonl",
        shared_context_sidecar_path: "./shared_context.jsonl"
      }
    })
  );

  await writeFile(
    dataPath,
    [
      "doc_id,text",
      'd1,"A vs B answer"',
      'd2,"Another pair"'
    ].join("\n")
  );

  await writeFile(sidecarPath, JSON.stringify({ doc_id: "d1", shared_context: "Prompt one" }));

  await assert.rejects(
    compileStudy({ specPath, datasetPath: dataPath, outDir }),
    /Compare sidecar is missing required doc_id: d2/
  );
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
