#!/usr/bin/env node
import { exportWebapp } from './index.mjs';

const args = process.argv.slice(2);
const manifestPath = args[args.indexOf('--manifest') + 1];
const outDir = args[args.indexOf('--out') + 1];
if (!manifestPath || !outDir) {
  console.error('Usage: thought-tagger-export-webapp --manifest <manifest.json> --out <dir>');
  process.exit(1);
}
await exportWebapp({ manifestPath, outDir });
console.log(`Exported webapp bundle into ${outDir}`);
