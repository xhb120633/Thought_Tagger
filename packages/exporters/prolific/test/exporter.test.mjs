import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportProlific } from '../src/index.mjs';

test('prolific exporter emits completion metadata', async () => {
  const out = await mkdtemp(join(tmpdir(), 'tt-prolific-'));
  const manifestPath = join(out, 'manifest.input.json');
  await writeFile(manifestPath, JSON.stringify({ study_id: 'demo_study' }));

  await exportProlific({ manifestPath, outDir: out, completionCode: 'ABC123' });

  const json = await readFile(join(out, 'prolific.json'), 'utf8');
  assert.match(json, /ABC123/);
  assert.match(json, /demo_study/);
});
