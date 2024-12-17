import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mm } from 'egg-mock';
import type { ClusterOptions } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function cluster(baseDir: string, options: ClusterOptions) {
  return mm.cluster({
    baseDir,
    customEgg: path.join(__dirname, 'fixtures/egg'),
    // eggPath: path.join(__dirname, '../node_modules/egg'),
    cache: false,
    opt: {
      // clear execArgv from egg-bin
      execArgv: [],
    },
    ...options,
  });
}

export function getFilepath(name: string) {
  return path.join(__dirname, 'fixtures', name);
}
