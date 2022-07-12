/* global describe, it */

// import { testLog } from '../emitLog'

import { Event, makeEvent } from '.'

describe('makeEvent', function () {
  it('creates a simple event', function () {
    const log = makeAssertLog()
    const [on, emit]: Event<string> = makeEvent()

    const unsubscribe = on(log)
    emit('a')
    emit('b')
    log.assert('a', 'b')

    // Unsubscribe should work:
    unsubscribe()
    emit('c')
    log.assert()
  })

  it('unsubscribe is unique & idempotent', function () {
    const log = makeAssertLog()
    const [on, emit]: Event<string> = makeEvent()

    // Subscribing twice gives double events:
    const unsubscribe1 = on(log)
    const unsubscribe2 = on(log)
    emit('a')
    log.assert('a', 'a')

    // The first unsubscribe should only remove the first callback:
    unsubscribe1()
    unsubscribe1()
    emit('b')
    log.assert('b')

    // Now everything should be unsubscribed:
    unsubscribe2()
    emit('c')
    log.assert()
  })

  it('unsubscribe works during emit', function () {
    const log = makeAssertLog()
    const [on, emit]: Event<string> = makeEvent()

    // Auto-unsubscribe to get a single event:
    const unsubscribe = on(message => {
      log(message)
      unsubscribe()
    })
    emit('a')
    log.assert('a')

    // Future events should not show up:
    emit('b')
    log.assert()
  })

  it('double-emits do not crash', function () {
    const log = makeAssertLog()
    const [on, emit]: Event<string> = makeEvent()

    const unsubscribe = on(message => {
      log('first', message)

      // Completely change the subscribers:
      unsubscribe()
      on(message => log('second', message))

      // Do a recursive emit:
      emit('b')
    })

    // Kick off the process:
    emit('a')
    log.assert('first a', 'second b')
  })
})
