/**
 * @module expose.cjs 
 *
 * @example expose.js/cjs
 * ```js
 * module.exports = {__dirname};
 * ```
 * @example use.mjs/esm
 * ```js
 * import expose from './expose.js';
 * const {__dirname} = expose;
 * ```
 *
 * @see {@link https://stackoverflow.com/a/46745166/10109857}
 */

/**
 * returns the root package.json
 * @type {import('./types').PackageJson}
 */
const pkg = (() => require('../package.json'))();

/**
 * return's events
 * @returns {EventEmitter}
 */
function EventEmitterWrapper() {
  return require('../dist/index.cjs');
}

module.exports = { dirname: __dirname, EventEmitterWrapper, pkg };
