/* eslint-disable test/no-import-node-test -- Node's built-in regression runner */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { effectScope, nextTick, shallowRef } from 'vue'
import { usePreviewerFlip } from '../../src/forum/components/ui/image-previewer/composables/usePreviewerFlip'

function fixture(reducedMotion = false, loaded = true) {
  const originalWindow = globalThis.window
  Object.assign(globalThis, {
    window: { setTimeout, matchMedia: () => ({ matches: reducedMotion }) },
  })
  const scope = effectScope()
  const listeners = new Map<string, () => void>()
  const animations: { keyframes: Keyframe[], options: KeyframeAnimationOptions, cancelled: boolean, onfinish?: () => void }[] = []
  const image = {
    complete: loaded,
    naturalWidth: loaded ? 960 : 0,
    getBoundingClientRect: () => ({ left: 200, top: 100, width: 960, height: 640 }),
    addEventListener: (event: string, listener: () => void) => listeners.set(event, listener),
    removeEventListener: (event: string) => listeners.delete(event),
  } as unknown as HTMLImageElement
  const stack = {
    animate: (keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      const record = { keyframes, options, cancelled: false, onfinish: undefined as (() => void) | undefined }
      animations.push(record)
      return Object.assign(record, { cancel: () => {
        record.cancelled = true
      } })
    },
  } as unknown as HTMLDivElement
  const flip = scope.run(() => usePreviewerFlip(shallowRef(image), shallowRef(stack)))!
  const source = { getBoundingClientRect: () => ({ left: 40, top: 300, width: 180, height: 120 }) } as Element
  return { flip, source, image, animations, listeners, dispose: () => {
    scope.stop()
    Object.assign(globalThis, { window: originalWindow })
  } }
}

test('source entrance stays active until the browser finishes its transform animation', async (t) => {
  const f = fixture()
  t.after(f.dispose)
  f.flip.setSource(f.source)
  assert.equal(f.flip.entering.value, true)
  f.flip.beginEnter()
  await nextTick()
  assert.equal(f.animations.length, 1)
  assert.equal(f.animations[0].options.duration, 420)
  assert.equal(f.flip.flipping.value, true)
  assert.match(String(f.animations[0].keyframes[0].transform), /translate\(-550px, -60px\)/)
  f.animations[0].onfinish?.()
  assert.equal(f.flip.entering.value, false)
  assert.equal(f.flip.flipping.value, false)
})

test('switching away cancels pending image load and prevents a late entrance', async (t) => {
  const f = fixture(false, false)
  t.after(f.dispose)
  f.flip.setSource(f.source)
  f.flip.beginEnter()
  await nextTick()
  const lateLoad = f.listeners.get('load')!
  assert.ok(lateLoad)
  f.flip.clearSource()
  Object.assign(f.image, { naturalWidth: 960 })
  lateLoad()
  assert.equal(f.listeners.size, 0)
  assert.equal(f.animations.length, 0)
  assert.equal(f.flip.entering.value, false)
})

test('reduced motion skips source transforms', async (t) => {
  const f = fixture(true)
  t.after(f.dispose)
  f.flip.setSource(f.source)
  f.flip.beginEnter()
  await nextTick()
  assert.equal(f.animations.length, 0)
  assert.equal(f.flip.entering.value, false)
})

test('clearing the source cancels an active entrance', async (t) => {
  const f = fixture()
  t.after(f.dispose)
  f.flip.setSource(f.source)
  f.flip.beginEnter()
  await nextTick()
  f.flip.clearSource()
  assert.equal(f.animations[0].cancelled, true)
  assert.equal(f.flip.entering.value, false)
  assert.equal(f.flip.flipping.value, false)
})
