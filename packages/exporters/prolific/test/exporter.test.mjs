import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportProlific } from '../src/index.mjs';

test('prolific exporter emits completion metadata', async () => {
  const out = await mkdtemp(join(tmpdir(), 'tt-prolific-'));
  await exportProlific({ manifestPath: join(process.cwd(), '../../../examples/sentence_labeling/out/manifest.json'), outDir: out, completionCode: 'ABC123' });
  const json = await readFile(join(out, 'prolific.json'), 'utf8');
  assert.match(json, /ABC123/);
});
