import assert from 'node:assert/strict'
import { test } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useMobileEditorViewport } from '../../src/forum/composables/view/useMobileEditorViewport'

test('mobile viewport distinguishes keyboard from zoom and removes scheduled work on close', async () => {
  class Element {
    isContentEditable = true
    contains() { return true }
    matches() { return true }
    querySelector() { return null }
  }
  const viewport = Object.assign(new EventTarget(), { height: 800, scale: 1, offsetTop: 0 })
  const fakeWindow = Object.assign(new EventTarget(), { innerHeight: 800, innerWidth: 375, visualViewport: viewport })
  const root = new Element()
  const fakeDocument = Object.assign(new EventTarget(), { activeElement: root })
  let id = 0
  const frames = new Map<number, FrameRequestCallback>()
  const replacements = {
    window: fakeWindow,
    document: fakeDocument,
    HTMLElement: Element,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++id, callback)
      return id
    },
    cancelAnimationFrame: (frame: number) => frames.delete(frame),
  }
  const descriptors = Object.fromEntries(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(replacements))
    Object.defineProperty(globalThis, key, { configurable: true, value })
  const scope = effectScope()
  const open = ref(true)
  const desktop = ref(false)
  try {
    const state = scope.run(() => useMobileEditorViewport(open, desktop, ref(root as unknown as HTMLElement), '.rich-editor-scroll'))!
    async function resize(height: number, scale = 1) {
      Object.assign(viewport, { height, scale })
      viewport.dispatchEvent(new Event('resize'))
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach(callback => callback(0))
      await nextTick()
    }
    await nextTick()
    await resize(680)
    assert.equal(state.keyboardVisible.value, false)
    await resize(679)
    assert.equal(state.keyboardVisible.value, true)
    assert.equal(state.drawerStyle.value?.['--compact-viewport-height'], '679px')
    assert.equal(state.drawerStyle.value?.['--compact-viewport-bottom'], '121px')
    await resize(730)
    assert.equal(state.keyboardVisible.value, true)
    await resize(740)
    assert.equal(state.keyboardVisible.value, false)
    await resize(400, 1.5)
    assert.equal(state.drawerStyle.value?.['--compact-viewport-height'], '740px')
    desktop.value = true
    await nextTick()
    assert.equal(state.drawerStyle.value, undefined)
    assert.equal(state.keyboardVisible.value, false)
    assert.equal(frames.size, 0)
    desktop.value = false
    await nextTick()
    await resize(800)
    assert.equal(state.keyboardVisible.value, false)
    assert.equal(state.drawerStyle.value?.['--compact-viewport-bottom'], '0px')
    open.value = false
    await nextTick()
    assert.equal(state.drawerStyle.value, undefined)
    assert.equal(frames.size, 0)
    viewport.dispatchEvent(new Event('resize'))
    fakeWindow.dispatchEvent(new Event('resize'))
    fakeDocument.dispatchEvent(new Event('focusin'))
    assert.equal(frames.size, 0)
  }
  finally {
    scope.stop()
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor)
        Object.defineProperty(globalThis, key, descriptor)
      else
        Reflect.deleteProperty(globalThis, key)
    }
  }
})
