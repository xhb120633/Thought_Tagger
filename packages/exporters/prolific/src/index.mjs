import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function exportProlific({ manifestPath, outDir, completionCode = 'COMPLETE' }) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await mkdir(outDir, { recursive: true });
  const link = `https://app.prolific.com/submissions/complete?cc=${encodeURIComponent(completionCode)}`;
  await writeFile(join(outDir, 'prolific.json'), JSON.stringify({ studyId: manifest.study_id, completionCode, completionUrl: link }, null, 2) + '\n');
  await writeFile(join(outDir, 'complete.html'), `<!doctype html><html><body><a href=\"${link}\">Complete on Prolific</a></body></html>`);
}
