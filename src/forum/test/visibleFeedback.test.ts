/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import assert from 'node:assert/strict'
import test from 'node:test'
import { isVisibleFeedback } from '../../utils/isVisibleFeedback'

test('only an exposed result in the foreground viewport replaces a toast', () => {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  let visible = true
  let hit: Element | null
  let rect = { left: 10, top: 10, right: 110, bottom: 40 }
  const element = {
    checkVisibility: () => visible,
    getBoundingClientRect: () => rect,
    contains: (target: Element) => target === element,
  } as unknown as Element
  hit = element
  const documentStub = { visibilityState: 'visible', elementFromPoint: () => hit }
  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentStub })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { innerWidth: 800, innerHeight: 600 } })
  try {
    assert.equal(isVisibleFeedback(element), true)
    rect = { left: 10, top: 610, right: 110, bottom: 640 }
    assert.equal(isVisibleFeedback(element), false)
    rect = { left: 10, top: 590, right: 110, bottom: 620 }
    assert.equal(isVisibleFeedback(element), false, 'a partially visible result is not enough')
    rect = { left: 10, top: 10, right: 110, bottom: 40 }
    hit = {} as Element
    assert.equal(isVisibleFeedback(element), false, 'a dialog or clipped container hides the result')
    hit = null
    assert.equal(isVisibleFeedback(element), false)
    hit = element
    visible = false
    assert.equal(isVisibleFeedback(element), false)
    visible = true
    documentStub.visibilityState = 'hidden'
    assert.equal(isVisibleFeedback(element), false)
  }
  finally {
    if (originalDocument)
      Object.defineProperty(globalThis, 'document', originalDocument)
    else
      Reflect.deleteProperty(globalThis, 'document')
    if (originalWindow)
      Object.defineProperty(globalThis, 'window', originalWindow)
    else
      Reflect.deleteProperty(globalThis, 'window')
  }
})
