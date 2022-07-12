// @export Callback
export type Callback<T> = (payload: T) => void
// @export Unsubscribe
export type Unsubscribe = () => void

// Standalone events:
// @export OnEvent
export type OnEvent<T> = (callback: Callback<T>) => Unsubscribe
export type EmitEvent<T> = (payload: T) => void
export type Event<T> = [OnEvent<T>, EmitEvent<T>]


/**
 * Named events
 *
 */ 
export type OnEvents<T> = <Name extends keyof T>(
  name: Name,
  callback: Callback<T[Name]>
) => Unsubscribe
export type EmitEvents<T> = <Name extends keyof T>(
  name: Name,
  payload: T[Name]
) => void
export type Events<T> = [OnEvents<T>, EmitEvents<T>]

/**
 * Create a standalone event.
 * Returns a subscriber function and an emitter function.
 */
export function makeEvent<T>(): Event<T> {
  let callbacks: Array<Callback<T>> = []
  let callbacksLocked = false

  // Clone the callback list if necessary,
  // so the changes will only apply on the next emit.
  function unlockCallbacks(): void {
    if (callbacksLocked) {
      callbacksLocked = false
      callbacks = callbacks.slice()
    }
  }

  const on: OnEvent<T> = callback => {
    unlockCallbacks()
    callbacks.push(callback)

    let subscribed = true
    return function unsubscribe() {
      if (subscribed) {
        subscribed = false
        unlockCallbacks()
        callbacks.splice(callbacks.indexOf(callback), 1)
      }
    }
  }

  const emit: EmitEvent<T> = payload => {
    callbacksLocked = true
    const snapshot = callbacks
    for (let i = 0; i < snapshot.length; ++i) {
      snapshot[i](payload)
    }
    callbacksLocked = false
  }

  return [on, emit]
}

type EventMap<T> = {
  [Name in keyof T]?: Event<T[Name]>
}

export function makeEvents<T>(): Events<T> {
  const events: EventMap<T> = {}

  const on: OnEvents<T> = (name, callback) => {
    let event = events[name]
    if (event == null) event = events[name] = makeEvent()
    return event[0](callback)
  }

  const emit: EmitEvents<T> = (name, payload) => {
    const event = events[name]
    if (event != null) event[1](payload)
  }

  return [on, emit]
};
