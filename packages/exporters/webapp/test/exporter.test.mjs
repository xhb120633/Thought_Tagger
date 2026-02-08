import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportWebapp } from '../src/index.mjs';

test('webapp exporter emits runnable files', async () => {
  const out = await mkdtemp(join(tmpdir(), 'tt-webapp-'));
  await exportWebapp({
    manifestPath: join(process.cwd(), '../../../examples/sentence_labeling/out/manifest.json'),
    outDir: out
  });
  const html = await readFile(join(out, 'index.html'), 'utf8');
  assert.match(html, /ThoughtTagger Webapp/);
});
