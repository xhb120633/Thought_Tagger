import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportJsPsych } from '../src/index.mjs';

test('jspsych exporter emits experiment bundle', async () => {
  const out = await mkdtemp(join(tmpdir(), 'tt-jspsych-'));
  await exportJsPsych({ manifestPath: join(process.cwd(), '../../../examples/sentence_labeling/out/manifest.json'), outDir: out });
  const js = await readFile(join(out, 'experiment.js'), 'utf8');
  assert.match(js, /THOUGHT_TAGGER_STUDY/);
});
