/** @export EventEmitterWrapper  */
import { EventEmitterWrapper } from './events';
export { EventEmitterWrapper };

/** @export SafeEventEmitter  */
import { SafeEventEmitter } from './events';
export { SafeEventEmitter };

/** @export IEvents  */
import { IEvents } from './events';
export { IEvents };

export { safeApply } from './events';
export { arrayClone } from './events';
export type { Handler } from './events';

/**
 * @dev Note: both styles of export have no impact on output of dist
 *   However we should Prefer Named Exports as opposed to defaults.
 *   see README for more info
 */
export * from './interface';
export * from './interface/index';
export * from './events';
export type { Disposable, Listener, TypedEvent } from './interface/typed';
