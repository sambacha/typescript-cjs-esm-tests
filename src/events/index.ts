/** @export EventEmitterWrapper  */
import { EventEmitterWrapper } from './events.js';
export { EventEmitterWrapper };

/** @export SafeEventEmitter  */
import { SafeEventEmitter } from './events.js';
export { SafeEventEmitter };

/** @export IEvents  */
import { IEvents } from './events.js';
export { IEvents };

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
