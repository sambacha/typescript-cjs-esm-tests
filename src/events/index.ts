/**
 * @package ts-module-mock
 * @license Apache-2.0
 * @ssee {@link https://github.com/sambacha/typescript-cjs-esm-tests}
 */

import { EventEmitterWrapper } from './events.js';
export { EventEmitterWrapper };
export { SafeEventEmitter } from './events.js';
export { IEvents } from './events.js';
export { safeApply } from './events.js';
export { arrayClone } from './events.js';
export type { Handler } from './events.js';

/**
 * @dev Note: both styles of export have no impact on output of dist
 *   However we should Prefer Named Exports as opposed to defaults.
 *   see README for more info
 */
export * from './interface';
export * from './interface/index.js';
export * from './events.js';
export type { Disposable, Listener, TypedEvent } from './interface/typed';
///!
