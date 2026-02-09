#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REQUIRED_DOCS = [
  'docs/security_compliance.md',
  'docs/operations_runbook.md',
  'docs/environment_matrix.md'
];

const OPTIONAL_MARKERS = [
  '.env.production',
  '.env.staging',
  '.env.release',
  'ops/release.env'
];

const configuredOptionalFiles = (process.env.PREFLIGHT_REQUIRED_OPTIONAL_FILES ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const missingDocs = REQUIRED_DOCS.filter((docPath) => !existsSync(docPath));
if (missingDocs.length > 0) {
  console.error('❌ Preflight failed: missing required documentation files:');
  for (const docPath of missingDocs) {
    console.error(`   - ${docPath}`);
  }
  process.exit(1);
}
console.log(`✅ Required docs present (${REQUIRED_DOCS.length}/${REQUIRED_DOCS.length}).`);

if (configuredOptionalFiles.length > 0) {
  const missingOptional = configuredOptionalFiles.filter((filePath) => !existsSync(filePath));
  if (missingOptional.length > 0) {
    console.error('❌ Preflight failed: missing configured optional deployment files:');
    for (const filePath of missingOptional) {
      console.error(`   - ${filePath}`);
    }
    process.exit(1);
  }
  console.log(
    `✅ Configured optional deployment files present (${configuredOptionalFiles.length}/${configuredOptionalFiles.length}).`
  );
} else {
  const presentMarkers = OPTIONAL_MARKERS.filter((filePath) => existsSync(filePath));
  const missingMarkers = OPTIONAL_MARKERS.filter((filePath) => !existsSync(filePath));
  console.log(`ℹ️ Optional deployment markers present: ${presentMarkers.length}.`);
  if (presentMarkers.length > 0) {
    for (const filePath of presentMarkers) {
      console.log(`   - ${filePath}`);
    }
  }
  if (missingMarkers.length > 0) {
    console.log('ℹ️ Optional deployment markers not found (not required by default):');
    for (const filePath of missingMarkers) {
      console.log(`   - ${filePath}`);
    }
  }
  console.log(
    'ℹ️ Set PREFLIGHT_REQUIRED_OPTIONAL_FILES=file1,file2 to enforce optional deployment files in CI.'
  );
}

console.log('▶ Running npm run check:all ...');
const checkAll = spawnSync('npm', ['run', 'check:all'], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (checkAll.status !== 0) {
  const exitCode = checkAll.status ?? 1;
  console.error(`❌ Preflight failed: npm run check:all exited with status ${exitCode}.`);
  process.exit(exitCode);
}

console.log('✅ Preflight passed: release checks completed successfully.');
