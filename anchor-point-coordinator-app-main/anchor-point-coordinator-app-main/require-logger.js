// require-logger.js
if (!global.__patchedRequire) {
  global.__patchedRequire = true;

  const originalRequire = global.require;

  global.require = function (id) {
    try {
      const result = originalRequire(id);
      console.log(`📦 require('${id}') -> OK`);
      return result;
    } catch (err) {
      console.error(`❌ require('${id}') failed:`, err);
      throw err;
    }
  };
}
