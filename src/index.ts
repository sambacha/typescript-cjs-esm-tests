/**
 * @package ts-module-mock
 * @license Apache-2.0
 * @ssee {@link https://github.com/sambacha/typescript-cjs-esm-tests}
 */


export * from './events/index'
export { EventEmitterWrapper } from './events/events'
export { SafeEventEmitter } from './events/events'
export { IEvents } from './events/events'
export { safeApply } from './events/events'
export { arrayClone } from './events/events'
export type { Handler } from './events/events'

export * from './events/interface';
export * from './events/interface/index';
export * from './events/interface/typed';
export * from './events/events';

// test dist for events/index
export * from './events';
export * from './events/index';
