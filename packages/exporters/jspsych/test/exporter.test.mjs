import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportJsPsych } from '../src/index.mjs';

test('jspsych exporter emits experiment bundle', async () => {
  const out = await mkdtemp(join(tmpdir(), 'tt-jspsych-'));
  const manifestPath = join(out, 'manifest.input.json');
  await writeFile(manifestPath, JSON.stringify({ study_id: 'demo_study' }));

  await exportJsPsych({ manifestPath, outDir: out });

  const js = await readFile(join(out, 'experiment.js'), 'utf8');
  assert.match(js, /THOUGHT_TAGGER_STUDY/);
  assert.match(js, /demo_study/);
});
