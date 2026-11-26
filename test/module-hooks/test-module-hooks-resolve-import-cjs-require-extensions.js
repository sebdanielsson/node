'use strict';
// Test that when module.registerHooks() resolve hooks call nextResolve() and only
// override the format to 'commonjs', and the load hooks don't provide their own
// source, the imported CJS module is still loaded through require.extensions.

require('../common');
const { spawnSyncAndAssert } = require('../common/child_process');
const fixtures = require('../common/fixtures');

const main = fixtures.path('module-hooks', 'import-cjs-require-extensions', 'main.js');

for (const load of ['pass-through', 'spread', 'format-override', 'next-twice', 'nullish-source']) {
  spawnSyncAndAssert(process.execPath, [main, load], {
    stdout: 'transformed',
    trim: true,
  });
}
