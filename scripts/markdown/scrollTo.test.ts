/* eslint-disable test/no-import-node-test -- verify scrolling without a DOM implementation */
import assert from 'node:assert/strict'
import test from 'node:test'
import { scrollTo } from '../../src/composables/scrollTo'

test('explicit targets work without a URL hash and honor CSS offsets and reduced motion', (t) => {
  const root = {}
  const target = { getBoundingClientRect: () => ({ top: 300 }) } as unknown as Element
  const calls: ScrollToOptions[] = []
  // Node has no browser globals; restore all descriptors after the test.
  const globals = {
    requestAnimationFrame: (callback: FrameRequestCallback) => callback(0),
    window: {
      scrollY: 100,
      innerHeight: 800,
      getComputedStyle: (element: unknown) => element === root ? { scrollPaddingTop: '10px' } : { scrollMarginTop: '80px' },
      matchMedia: () => ({ matches: true }),
      scrollTo: (options: ScrollToOptions) => calls.push(options),
    },
    document: { documentElement: root, getElementById: () => target },
    location: { hash: '' },
  }
  for (const [key, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { value, configurable: true })
    t.after(() => previous ? Object.defineProperty(globalThis, key, previous) : Reflect.deleteProperty(globalThis, key))
  }
  scrollTo({ hash: '#reply-1', offset: 5 })
  assert.deepEqual(calls, [{ left: 0, top: 315, behavior: 'instant' }])
  scrollTo({ hash: '#%invalid' })
  assert.equal(calls.length, 1)
})
