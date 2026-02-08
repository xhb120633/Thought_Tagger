import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function exportJsPsych({ manifestPath, outDir }) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(join(outDir, 'experiment.js'), `window.THOUGHT_TAGGER_STUDY=${JSON.stringify(manifest.study_id)};`);
  await writeFile(join(outDir, 'index.html'), '<!doctype html><html><body><script src="./experiment.js"></script><main id="jspsych-root">jsPsych study</main></body></html>');
}
