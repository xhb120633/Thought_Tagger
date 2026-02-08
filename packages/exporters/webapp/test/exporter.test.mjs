import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportWebapp } from '../src/index.mjs';

test('webapp exporter emits runnable files', async () => {
  const out = await mkdtemp(join(tmpdir(), 'tt-webapp-'));
  const manifestPath = join(out, 'manifest.input.json');
  await writeFile(manifestPath, JSON.stringify({ study_id: 'demo_study', task_type: 'label' }));

  await exportWebapp({ manifestPath, outDir: out });

  const html = await readFile(join(out, 'index.html'), 'utf8');
  const appJs = await readFile(join(out, 'app.js'), 'utf8');
  assert.match(html, /ThoughtTagger Webapp/);
  assert.match(appJs, /demo_study/);
});
