import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { runLinearSession } from "../packages/compiler/dist/src/session.js";

const args = parseArgs(process.argv.slice(2));
if (!args.bundle || !args.out || !args.annotator) {
  console.error("Usage: node tools/run-session-cycle.mjs --bundle <webapp/study-bundle.json> --annotator <id> --out <dir>");
  process.exit(1);
}

const bundle = JSON.parse(await readFile(args.bundle, "utf8"));
const { annotations, events } = runLinearSession(bundle.spec, bundle.units, args.annotator, (unit, index) => ({
  text: `auto-response-${index + 1}:${unit.unit_id}`
}));

const annotationHeader = [
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

await mkdir(args.out, { recursive: true });
await writeFile(join(args.out, "annotation_results.csv"), [annotationHeader.join(","), ...annotations.map((row) => annotationHeader.map((field) => csvEscape(row[field])).join(","))].join("\n") + "\n", "utf8");
await writeFile(join(args.out, "event_log.jsonl"), events.map((event) => JSON.stringify(event)).join("\n") + "\n", "utf8");

console.log(`Session completed for ${annotations.length} unit(s).`);
console.log(`Wrote ${join(args.out, "annotation_results.csv")}`);
console.log(`Wrote ${join(args.out, "event_log.jsonl")}`);

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--bundle") out.bundle = argv[i + 1];
    if (argv[i] === "--annotator") out.annotator = argv[i + 1];
    if (argv[i] === "--out") out.out = argv[i + 1];
  }
  return out;
}
