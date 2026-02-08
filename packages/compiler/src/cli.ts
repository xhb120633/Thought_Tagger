#!/usr/bin/env node
import { compileStudy } from "./index.js";

interface Args {
  spec?: string;
  dataset?: string;
  out?: string;
  contextSidecar?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--spec") args.spec = argv[i + 1];
    if (token === "--dataset") args.dataset = argv[i + 1];
    if (token === "--out") args.out = argv[i + 1];
    if (token === "--context-sidecar") args.contextSidecar = argv[i + 1];
  }
  return args;
}

function usage(): string {
  return "Usage: thought-tagger-compile --spec <path> --dataset <path(.csv|.jsonl)> --out <dir> [--context-sidecar <path.jsonl>]";
}

const parsed = parseArgs(process.argv.slice(2));
if (!parsed.spec || !parsed.dataset || !parsed.out) {
  console.error(usage());
  process.exit(1);
}

compileStudy({ specPath: parsed.spec, datasetPath: parsed.dataset, outDir: parsed.out, contextSidecarPath: parsed.contextSidecar })
  .then(() => {
    console.log(`Compiled study into ${parsed.out}`);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
