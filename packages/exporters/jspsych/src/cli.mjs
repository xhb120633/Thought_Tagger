#!/usr/bin/env node
import { exportJsPsych } from './index.mjs';
const args = process.argv.slice(2);
const manifestPath = args[args.indexOf('--manifest') + 1];
const outDir = args[args.indexOf('--out') + 1];
if (!manifestPath || !outDir) {
  console.error('Usage: thought-tagger-export-jspsych --manifest <manifest.json> --out <dir>');
  process.exit(1);
}
await exportJsPsych({ manifestPath, outDir });
console.log(`Exported jsPsych bundle into ${outDir}`);
