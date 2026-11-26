'use strict';
// Test that imported CJS uses the format and source provided by synchronous load
// hooks when the resolution isn't short-circuited by the resolve hooks, instead of
// being resolved and loaded again by the CommonJS loader based on its file name.
// Refs: https://github.com/nodejs/node/pull/62920

const common = require('../common');
const assert = require('assert');
const fixtures = require('../common/fixtures');
const { registerHooks } = require('module');

const fixtureURL = (name) => fixtures.fileURL('module-hooks', 'import-cjs-custom-format', name).href;
const fixturePath = (name) => fixtures.path('module-hooks', 'import-cjs-custom-format', name);
const mutatedURL = fixtureURL('mutated.mjs');
const missingURL = fixtureURL('missing.cjs');
const dataURL = 'data:text/javascript,export default "from data URL";';
const names = new Map([
  [fixtureURL('data.json'), 'data.json'],
  [fixtureURL('module.mjs'), 'module.mjs'],
  [missingURL, 'missing.cjs'],
  [dataURL, 'data URL'],
]);

const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      // A module that is not on disk.
      if (specifier === missingURL) {
        return { url: missingURL, shortCircuit: true };
      }
      throw err;
    }
  },
  load: common.mustCall((url, context, nextLoad) => {
    if (url === mutatedURL) {
      // Modify the result from the default step in place.
      const result = nextLoad(url, context);
      result.format = 'commonjs';
      result.source = 'module.exports = { name: "mutated.mjs", filename: __filename };';
      return result;
    }
    const name = names.get(url);
    if (name !== undefined) {
      return {
        format: 'commonjs',
        source: `module.exports = { name: ${JSON.stringify(name)}, filename: __filename };`,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  }, 5),
});

(async () => {
  for (const name of ['data.json', 'module.mjs', 'mutated.mjs', 'missing.cjs']) {
    const { default: result } = await import(fixtureURL(name));
    assert.deepStrictEqual(result, { name, filename: fixturePath(name) });
  }
  const { default: result } = await import(dataURL);
  assert.strictEqual(result.name, 'data URL');
  hook.deregister();
})().then(common.mustCall());
