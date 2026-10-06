import type { TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { it } from 'node:test'
import { preparePublishTypeMotion } from '../../src/forum/components/utils/publishTopicTypeTransition'

interface MockElement {
  style: {
    getPropertyValue: (key: string) => string
    setProperty: (key: string, value: string) => void
    removeProperty: (key: string) => void
  }
  querySelector: (selector: string) => MockElement | null
}
function element(): MockElement {
  const properties = new Map<string, string>()
  return {
    style: {
      getPropertyValue: (key: string) => properties.get(key) ?? '',
      setProperty: (key: string, value: string) => properties.set(key, value),
      removeProperty: (key: string) => properties.delete(key),
    },
    querySelector: (_selector: string): MockElement | null => null,
  }
}

function setupMotion(t: TestContext, mounted = true) {
  const computed = { borderTopLeftRadius: '9999px', borderRadius: '9999px', padding: '8px', getPropertyValue: () => '', * [Symbol.iterator]() {} }
  let notifyMount = () => {}
  let observing = false
  const globals = {
    getComputedStyle: () => computed,
    MutationObserver: class {
      constructor(callback: () => void) { notifyMount = callback }
      observe() { observing = true }
      disconnect() { observing = false }
    },
  }
  for (const [key, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, value })
    t.after(() => {
      if (previous)
        Object.defineProperty(globalThis, key, previous)
      else
        Reflect.deleteProperty(globalThis, key)
    })
  }
  let frames: Keyframe[] = []
  let duration: number | undefined
  let removed = false
  let appended = false
  let measuringForm = false
  let shellFrames: Keyframe[] = []
  let formTiming: KeyframeAnimationOptions | undefined
  const attributes = new Map<string, string>()
  const target = { ...element(), isConnected: true, style: { ...element().style, opacity: '0.9' }, getBoundingClientRect: () => ({ left: 32, top: 40, width: 120, height: 32 }) }
  const ghost = {
    ...element(),
    querySelectorAll: () => [],
    removeAttribute: () => {},
    setAttribute: (key: string, value: string) => attributes.set(key, value),
    remove: () => { removed = true },
    animate(keyframes: Keyframe[], options: KeyframeAnimationOptions) {
      frames = keyframes
      duration = options.duration as number
      assert.equal(target.style.opacity, '0')
      return { finished: Promise.resolve(), cancel: () => {} }
    },
  }
  const source = {
    ...element(),
    cloneNode: () => ghost,
    closest: () => null,
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 32, top: 160, width: 700, height: 56 }),
    ownerDocument: { body: { append: () => { appended = true } } },
  }
  const form = {
    animate(_frames: Keyframe[], timing: KeyframeAnimationOptions) {
      formTiming = timing
      return { finished: Promise.resolve(), cancel: () => {} }
    },
  }
  const shell = {
    ...element(),
    style: { ...element().style, height: '', flex: '', overflow: '' },
    getBoundingClientRect: () => ({ height: measuringForm ? 360 : 232 }),
    querySelector: (selector: string) => {
      if (selector === '[data-publish-type-form]')
        return form
      if (mounted) {
        measuringForm = true
        return target
      }
      return null
    },
    animate(keyframes: Keyframe[]) {
      shellFrames = keyframes
      return { finished: Promise.resolve(), cancel: () => {} }
    },
  }
  const motion = preparePublishTypeMotion(source as unknown as HTMLElement, shell as unknown as HTMLElement)
  return {
    motion,
    target,
    shell,
    attributes,
    mount: () => {
      mounted = true
      notifyMount()
    },
    state: () => ({ frames, duration, removed, appended, observing, shellFrames, formTiming }),
  }
}

it('selection requests a visible row-to-trigger animation and restores the trigger', async (t) => {
  const { motion, target, attributes, state } = setupMotion(t)
  await motion.play()
  assert.equal(state().frames[0].top, '160px')
  assert.equal(state().frames[1].top, '40px')
  assert.equal(state().frames[0].width, '700px')
  assert.equal(state().frames[1].width, '120px')
  assert.equal(state().frames[1].borderRadius, '16px')
  assert.equal(state().duration, 460)
  assert.equal(attributes.get('aria-hidden'), 'true')
  assert.equal(target.style.opacity, '0.9')
  assert.equal(state().removed, true)
  assert.equal(state().observing, false)
})

it('grows the shell and gradually reveals the form after the chooser departs', async (t) => {
  const { motion, shell, state } = setupMotion(t)
  assert.equal(shell.style.height, '232px')
  await motion.play()
  assert.deepEqual(state().shellFrames, [{ height: '232px' }, { height: '360px' }])
  const timing = state().formTiming!
  assert.ok(Number(timing.delay) >= 120)
  assert.ok(Number(timing.duration) > Number(state().duration) / 2)
  assert.ok(Number(timing.delay) + Number(timing.duration) <= Number(state().duration))
  assert.equal(shell.style.height, '')
  assert.equal(shell.style.flex, '')
  assert.equal(shell.style.overflow, '')
})

it('keeps the row visible until the asynchronous menu trigger mounts', async (t) => {
  const { motion, mount, state } = setupMotion(t, false)
  const playing = motion.play()
  assert.equal(state().appended, true)
  assert.equal(state().removed, false)
  assert.equal(state().frames.length, 0)
  assert.equal(state().observing, true)
  mount()
  await playing
  assert.equal(state().frames.length, 2)
  assert.equal(state().removed, true)
  assert.equal(state().observing, false)
})

it('closing while the trigger loads releases the pending motion', async (t) => {
  const { motion, mount, state, target } = setupMotion(t, false)
  const playing = motion.play()
  motion.cancel()
  await playing
  mount()
  assert.equal(state().frames.length, 0)
  assert.equal(state().removed, true)
  assert.equal(state().observing, false)
  assert.equal(target.style.opacity, '0.9')
})
