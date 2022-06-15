import { EventEmitter } from 'node:events';

/** @source {@link https://github.com/NomicFoundation/hardhat/blob/master/packages/hardhat-core/src/internal/util/event-emitter.ts} */
/*! 
// Copyright (c) 2019 Nomic Labs LLC
// SPDX-License-Identifier: MIT
// SEE COPYING file for more information

// IMPORTANT NOTE: This class is type-checked against the currently installed
// version of @types/node (16.x atm), and manually checked to be compatible with
// Node.js up to 18.0.0 (the latest release atm). There's a test that ensures
// that we are exporting all the EventEmitter's members, but it can't check the
// actual types of those members if they are functions.
//
// If a new version of Node.js adds new members to EventEmitter or overloads
// existing ones this class has to be updated, even if it still type-checks.
// This is a serious limitation ot DefinitelyTyped when the original, un-typed,
// library can change because of the user having a different version.
*/
export class EventEmitterWrapper implements EventEmitter {
  constructor(private readonly _wrapped: EventEmitter) {}

  public addListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this._wrapped.addListener(event, listener);
    return this;
  }

  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    this._wrapped.on(event, listener);
    return this;
  }

  public once(event: string | symbol, listener: (...args: any[]) => void): this {
    this._wrapped.once(event, listener);
    return this;
  }

  public prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this._wrapped.prependListener(event, listener);
    return this;
  }

  public prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this._wrapped.prependOnceListener(event, listener);
    return this;
  }

  public removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this._wrapped.removeListener(event, listener);
    return this;
  }

  public off(event: string | symbol, listener: (...args: any[]) => void): this {
    this._wrapped.off(event, listener);
    return this;
  }

  public removeAllListeners(event?: string | symbol | undefined): this {
    this._wrapped.removeAllListeners(event);
    return this;
  }

  public setMaxListeners(n: number): this {
    this._wrapped.setMaxListeners(n);
    return this;
  }

  public getMaxListeners(): number {
    return this._wrapped.getMaxListeners();
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public listeners(event: string | symbol): Function[] {
    return this._wrapped.listeners(event);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public rawListeners(event: string | symbol): Function[] {
    return this._wrapped.rawListeners(event);
  }

  /**
   * @param {(string | symbol)} event
   * @param {...any[]} args
   * @return {*}  {boolean}
   * @memberof EventEmitterWrapper
   */
  public emit(event: string | symbol, ...args: any[]): boolean {
    return this._wrapped.emit(event, ...args);
  }

  /**
   * @return {*}  {(Array<string | symbol>)}
   * @memberof EventEmitterWrapper
   */
  public eventNames(): Array<string | symbol> {
    return this._wrapped.eventNames();
  }

  /**
   * @param {(string | symbol)} type
   * @return {*}  {number}
   * @memberof EventEmitterWrapper
   */
  public listenerCount(type: string | symbol): number {
    return this._wrapped.listenerCount(type);
  }
}

/**
 * @type {Handler}
 * @interface EventMap
 */
export type Handler = (...args: any[]) => void;
interface EventMap {
  [k: string]: Handler | Handler[] | undefined;
}

/**
 *
 * @function safeApply
 * @template T
 * @template A
 * @param {(this: T, ...args: A) => void} handler
 * @param {T} context
 * @param {A} args
 */
export function safeApply<T, A extends any[]>(
  handler: (this: T, ...args: A) => void,
  context: T,
  args: A,
): void {
  try {
    Reflect.apply(handler, context, args);
  } catch (err) {
    // Throw error after timeout so as not to interrupt the stack
    setTimeout(() => {
      throw err;
    });
  }
}

/** @function arrayClone */
export function arrayClone<T>(arr: T[]): T[] {
  const n = arr.length;
  const copy = new Array(n);
  for (let i = 0; i < n; i += 1) {
    copy[i] = arr[i];
  }
  return copy;
}

/**
 * SafeEventEmitter
 * @license ISC License
 * Copyright (c) 2020 MetaMask
 *
 */

/** @class SafeEventEmitter */
export class SafeEventEmitter extends EventEmitter {
  emit(type: string, ...args: any[]): boolean {
    let doError = type === 'error';

    const events: EventMap = (this as any)._events;
    if (events !== undefined) {
      doError = doError && events.error === undefined;
    } else if (!doError) {
      return false;
    }

    // If there is no 'error' event listener then throw.
    if (doError) {
      let er: any;
      let safeEr = er;
      if (args.length > 0) {
        [safeEr] = args;
      }
      if (safeEr instanceof Error) {
        // Note: The comments on the `throw` lines are intentional, they show
        // up in Node's output if this results in an unhandled exception.
        throw safeEr; // Unhandled 'error' event
      }
      // At least give some kind of context to the user
      const err = new Error(`Unhandled error.${safeEr ? ` (${safeEr.message})` : ''}`);
      (err as any).context = safeEr;
      throw err; // Unhandled 'error' event
    }

    const handler = events[type];

    if (handler === undefined) {
      console.error(`Unhandled event: ${type}`);
      return false;
    }

    if (typeof handler === 'function') {
      safeApply(handler, this, args);
    } else {
      const len = handler.length;
      const listeners = arrayClone(handler);
      for (let i = 0; i < len; i += 1) {
        safeApply(listeners[i], this, args);
      }
    }

    return true;
  }
}
/** @endclass */

/**
 * @export
 * @abstract
 * @class IEvents
 */
export abstract class IEvents {
  public abstract events: EventEmitter;

  public abstract on(event: string, listener: any): void;
  public abstract once(event: string, listener: any): void;
  public abstract off(event: string, listener: any): void;
  public abstract removeListener(event: string, listener: any): void;
}

/** 
* Event Emitter (ish)
* @implements EthersAbstractProvider
*/

export type BlockTag = string | number;

export interface EventFilter {
    address?: string;
    topics?: Array<string | Array<string> | null>;
}

export interface Filter extends EventFilter {
    fromBlock?: BlockTag,
    toBlock?: BlockTag,
}

export interface FilterByBlockHash extends EventFilter {
    blockHash?: string;
}

export type EventType = string | Array<string | Array<string>> | EventFilter | ForkEvent;

export abstract class EthersAbstractProvider {
  abstract on(eventName: EventType, listener: Listener): Provider;
  abstract once(eventName: EventType, listener: Listener): Provider;
  abstract emit(eventName: EventType, ...args: Array<any>): boolean
  abstract listenerCount(eventName?: EventType): number;
  abstract listeners(eventName?: EventType): Array<Listener>;
  abstract off(eventName: EventType, listener?: Listener): Provider;
  abstract removeAllListeners(eventName?: EventType): Provider;

  // Alias for "on"
  addListener(eventName: EventType, listener: Listener): Provider {
      return this.on(eventName, listener);
  }

  // Alias for "off"
  removeListener(eventName: EventType, listener: Listener): Provider {
      return this.off(eventName, listener);
  }
