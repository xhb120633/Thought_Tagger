import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportWebapp } from '../packages/exporters/webapp/src/index.mjs';
import { exportJsPsych } from '../packages/exporters/jspsych/src/index.mjs';
import { exportProlific } from '../packages/exporters/prolific/src/index.mjs';

const root = process.cwd();
const examples = await readdir(join(root, 'examples'), { withFileTypes: true });

for (const entry of examples) {
  if (!entry.isDirectory()) continue;
  const manifestPath = join(root, 'examples', entry.name, 'out', 'manifest.json');
  const tmp = await mkdtemp(join(tmpdir(), `tt-export-${entry.name}-`));
  try {
    await exportWebapp({ manifestPath, outDir: join(tmp, 'webapp') });
    await exportJsPsych({ manifestPath, outDir: join(tmp, 'jspsych') });
    await exportProlific({ manifestPath, outDir: join(tmp, 'prolific') });

    await readFile(join(tmp, 'webapp', 'index.html'), 'utf8');
    await readFile(join(tmp, 'jspsych', 'experiment.js'), 'utf8');
    await readFile(join(tmp, 'prolific', 'prolific.json'), 'utf8');
    console.log(`Exporter smoke pass: ${entry.name}`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
