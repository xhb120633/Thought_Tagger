import { mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const examplesDir = join(root, "examples");
const entries = await readdir(examplesDir, { withFileTypes: true });
const failures = [];

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const examplePath = join(examplesDir, entry.name);
  const specPath = join(examplePath, "study.spec.json");
  const jsonlDatasetPath = join(examplePath, "dataset.jsonl");
  const csvDatasetPath = join(examplePath, "dataset.csv");
  const outDir = join(examplePath, "out");

  if (!existsSync(specPath) || (!existsSync(jsonlDatasetPath) && !existsSync(csvDatasetPath))) {
    failures.push(`Example ${entry.name} is missing study.spec.json or dataset(.jsonl|.csv)`);
    continue;
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const datasetPath = existsSync(jsonlDatasetPath) ? jsonlDatasetPath : csvDatasetPath;
  const args = [
    "--spec",
    specPath,
    "--dataset",
    datasetPath,
    "--out",
    outDir
  ];

  await run("node", ["packages/compiler/dist/src/cli.js", ...args], root);
}

if (failures.length > 0) {
  for (const msg of failures) {
    console.error(msg);
  }
  process.exit(1);
}

async function run(command, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
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
