import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { compileStudy } from "../src/index.js";
import { runLinearSession } from "../src/session.js";

test("integration: compile example, execute session cycle, validate result schemas", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-int-"));
  const outDir = join(dir, "out");
  const resultDir = join(dir, "results");

  await compileStudy({
    specPath: join(process.cwd(), "..", "..", "examples", "sentence_labeling", "study.spec.json"),
    datasetPath: join(process.cwd(), "..", "..", "examples", "sentence_labeling", "dataset.jsonl"),
    outDir
  });

  const bundle = JSON.parse(await readFile(join(outDir, "webapp", "study-bundle.json"), "utf8"));
  const run = runLinearSession(bundle.spec, bundle.units, "integration_tester", (unit, index) => ({
    text: `integration-response-${index + 1}:${unit.unit_id}`
  }));

  await mkdir(resultDir, { recursive: true });

  const header = [
    "study_id",
    "rubric_version",
    "annotator_id",
    "doc_id",
    "unit_id",
    "task_type",
    "response_payload",
    "confidence",
    "rationale",
    "condition_id",
    "created_at",
    "updated_at"
  ];

  const csvLines = [header.join(","), ...run.annotations.map((row) => header.map((field) => csvEscape(row[field as keyof typeof row])).join(","))];
  await writeFile(join(resultDir, "annotation_results.csv"), `${csvLines.join("\n")}\n`, "utf8");
  await writeFile(join(resultDir, "event_log.jsonl"), `${run.events.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");

  await runCmd("node", [join(process.cwd(), "..", "..", "tools", "validate-annotation-table.mjs"), join(resultDir, "annotation_results.csv")]);
  await runCmd("node", [join(process.cwd(), "..", "..", "tools", "validate-event-log.mjs"), join(resultDir, "event_log.jsonl")]);

  assert.ok(run.annotations.length > 0);
  assert.ok(run.events.some((evt) => evt.event_type === "session_complete"));
});

function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

async function runCmd(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}
