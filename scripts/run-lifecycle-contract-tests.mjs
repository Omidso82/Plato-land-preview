/** Repeatable isolated lifecycle contract test runner; no new dependencies. */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'plato-lifecycle-'));
try {
  const compiler = require.resolve('typescript/bin/tsc');
  const result = spawnSync(process.execPath, [
    compiler, '--strict', '--target', 'ES2022', '--module', 'commonjs',
    '--rootDir', join(root, 'src'), '--outDir', out,
    join(root, 'src/temporaryLifecycle.ts'),
    join(root, 'src/temporaryLifecycle.contract.test.ts')
  ], {stdio:'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
  const compiled = createRequire(join(out, 'runner.cjs'))('./temporaryLifecycle.contract.test.js');
  const passed = compiled.runTemporaryLifecycleContractTests();
  if (passed !== 22) throw new Error('Unexpected lifecycle test count: '+passed);
  process.stdout.write('PASS '+passed+'/22 lifecycle contract assertions\n');
} finally {
  rmSync(out, {recursive:true, force:true});
}
