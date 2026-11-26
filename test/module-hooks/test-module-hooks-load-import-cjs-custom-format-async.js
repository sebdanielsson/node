'use strict';
// Test that imported CJS uses the format and source provided by synchronous load
// hooks, when asynchronous hooks from module.register() are registered as well.
// The asynchronous hooks run in the default step of the synchronous hooks.
// Refs: https://github.com/nodejs/node/issues/66998

require('../common');
const { spawnSyncAndExitWithoutError } = require('../common/child_process');
const fixtures = require('../common/fixtures');
const path = require('path');

const asyncForward = fixtures.fileURL('module-hooks', 'sync-and-async', 'async-forward.js').href;

spawnSyncAndExitWithoutError(process.execPath, [
  '--import', asyncForward,
  path.join(__dirname, 'test-module-hooks-load-import-cjs-custom-format.js'),
]);
