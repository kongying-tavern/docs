import type { TestContext } from 'vitest'
import assert from 'node:assert/strict'
import { test } from 'vitest'
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

function setupMotion(t: TestContext, targetPresent = true) {
  const computed = { borderTopLeftRadius: '9999px', borderRadius: '9999px', padding: '8px', getPropertyValue: () => '', * [Symbol.iterator]() {} }
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'getComputedStyle')
  Object.defineProperty(globalThis, 'getComputedStyle', { configurable: true, value: () => computed })
  t.onTestFinished(() => {
    if (previous)
      Object.defineProperty(globalThis, 'getComputedStyle', previous)
    else
      Reflect.deleteProperty(globalThis, 'getComputedStyle')
  })
  let frames: Keyframe[] = []
  let duration: number | undefined
  let removed = false
  let appended = false
  let measuringForm = false
  let shellFrames: Keyframe[] = []
  let formTiming: KeyframeAnimationOptions | undefined
  let handoffTiming: KeyframeAnimationOptions | undefined
  const attributes = new Map<string, string>()
  const target = {
    ...element(),
    isConnected: true,
    style: { ...element().style, opacity: '0.9' },
    getBoundingClientRect: () => ({ left: 32, top: 40, width: 120, height: 32 }),
    animate(_frames: Keyframe[], timing: KeyframeAnimationOptions) {
      handoffTiming = timing
      return { finished: Promise.resolve(), cancel: () => {} }
    },
  }
  const ghost = {
    ...element(),
    querySelectorAll: () => [],
    removeAttribute: () => {},
    setAttribute: (key: string, value: string) => attributes.set(key, value),
    remove: () => { removed = true },
    animate(keyframes: Keyframe[], options: KeyframeAnimationOptions) {
      if ('transform' in keyframes[0]) {
        frames = keyframes
        duration = options.duration as number
      }
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
      if (targetPresent) {
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
    state: () => ({ frames, duration, removed, appended, shellFrames, formTiming, handoffTiming }),
  }
}

test('selection requests a visible row-to-trigger animation and restores the trigger', async (t) => {
  const { motion, target, attributes, state } = setupMotion(t)
  await motion.play()
  assert.equal(state().frames[0].transform, 'translate(0px, 0px)')
  assert.equal(state().frames[1].transform, 'translate(0px, -120px)')
  assert.equal(state().frames[0].width, '700px')
  assert.equal(state().frames[1].width, '120px')
  assert.equal(state().frames[1].borderRadius, '16px')
  assert.equal(state().duration, 280)
  assert.equal(Number(state().handoffTiming!.delay) + Number(state().handoffTiming!.duration), state().duration)
  assert.equal(attributes.get('aria-hidden'), 'true')
  assert.equal(target.style.opacity, '0.9')
  assert.equal(state().removed, true)
})

test('grows the shell and gradually reveals the form after the chooser departs', async (t) => {
  const { motion, shell, state } = setupMotion(t)
  assert.equal(shell.style.height, '232px')
  await motion.play()
  assert.deepEqual(state().shellFrames, [{ height: '232px' }, { height: '360px' }])
  const timing = state().formTiming!
  assert.ok(Number(timing.delay) >= 40)
  assert.ok(Number(timing.duration) > Number(state().duration) / 2)
  assert.ok(Number(timing.delay) + Number(timing.duration) <= Number(state().duration))
  assert.equal(shell.style.height, '')
  assert.equal(shell.style.flex, '')
  assert.equal(shell.style.overflow, '')
})

test('a missing trigger releases the shell without waiting for a DOM mutation', async (t) => {
  const { motion, shell, state } = setupMotion(t, false)
  await motion.play()
  assert.equal(state().frames.length, 0)
  assert.equal(state().removed, true)
  assert.equal(shell.style.height, '')
  assert.equal(shell.style.flex, '')
  assert.equal(shell.style.overflow, '')
})

test('closing during playback removes the snapshot and restores the trigger', async (t) => {
  const { motion, state, target } = setupMotion(t)
  const playing = motion.play()
  motion.cancel()
  await playing
  assert.equal(state().frames.length, 2)
  assert.equal(state().removed, true)
  assert.equal(target.style.opacity, '0.9')
})

test('repeated cancellation cannot overwrite layout applied after the first cleanup', async (t) => {
  const { motion, shell } = setupMotion(t, false)
  const playing = motion.play()
  motion.cancel()
  shell.style.height = '400px'
  motion.cancel()
  await playing
  assert.equal(shell.style.height, '400px')
})

test('an unmeasurable target retains its original opacity', async (t) => {
  const { motion, target } = setupMotion(t)
  target.getBoundingClientRect = () => ({ left: 32, top: 40, width: 0, height: 0 })
  await motion.play()
  assert.equal(target.style.opacity, '0.9')
})

test('a disconnected trigger does not start playback or change its opacity', async (t) => {
  const { motion, target, shell, state } = setupMotion(t)
  target.isConnected = false
  await motion.play()
  assert.equal(state().frames.length, 0)
  assert.equal(state().removed, true)
  assert.equal(target.style.opacity, '0.9')
  assert.equal(shell.style.height, '')
})
