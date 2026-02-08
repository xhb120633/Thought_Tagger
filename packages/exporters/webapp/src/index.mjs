import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function exportWebapp({ manifestPath, outDir }) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>ThoughtTagger Webapp</title></head><body><div id=\"app\"></div><script type=\"module\" src=\"./app.js\"></script></body></html>`;
  await writeFile(join(outDir, 'index.html'), html);
  const appJs = `const key='thought-tagger-progress';\nconst state=JSON.parse(localStorage.getItem(key)||'{}');\nstate.lastLoadedManifest=${JSON.stringify(manifest.study_id)};\nlocalStorage.setItem(key, JSON.stringify(state));\ndocument.getElementById('app').textContent='Study: ${manifest.study_id}';`;
  await writeFile(join(outDir, 'app.js'), appJs);
  return { outDir };
}
