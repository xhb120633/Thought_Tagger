#!/usr/bin/env node
import { exportProlific } from './index.mjs';
const args = process.argv.slice(2);
const manifestPath = args[args.indexOf('--manifest') + 1];
const outDir = args[args.indexOf('--out') + 1];
const completionCode = args.includes('--completion-code') ? args[args.indexOf('--completion-code') + 1] : 'COMPLETE';
if (!manifestPath || !outDir) {
  console.error('Usage: thought-tagger-export-prolific --manifest <manifest.json> --out <dir> [--completion-code CODE]');
  process.exit(1);
}
await exportProlific({ manifestPath, outDir, completionCode });
console.log(`Exported Prolific helpers into ${outDir}`);
