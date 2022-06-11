/**
 * @package ts-module-mock
 * @license Apache-2.0
 * @ssee {@link https://github.com/sambacha/typescript-cjs-esm-tests}
 */

import './events/index.js'
export * from './events/index.js'
export { EventEmitterWrapper } from './events/events.js'
export { SafeEventEmitter } from './events/events.js'
export { IEvents } from './events/events.js'
export { safeApply } from './events/events.js'
export { arrayClone } from './events/events.js'
export type { Handler } from './events/events.js'

export * from './events/interface';
export * from './events/interface/index';
export * from './events/interface/typed.js';
export * from './events/events.js';

// test dist for events/index
export * from './events';
export * from './events/index';
