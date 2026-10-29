import { expect, test, vi } from 'vitest'
import { effectScope, ref, shallowRef } from 'vue'
import { usePreviewerTransform } from '../../src/forum/components/ui/image-previewer/composables/usePreviewerTransform'

function fixture(zoomEnabled = true, swipeEnabled = true) {
  const scope = effectScope()
  const image = {
    offsetWidth: 400,
    offsetHeight: 300,
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 400, height: 300 }),
  } as HTMLImageElement
  const onSwipe = vi.fn()
  const transform = scope.run(() => usePreviewerTransform({
    maxZoom: ref(4),
    imageEl: shallowRef(image),
    zoomEnabled: ref(zoomEnabled),
    swipeEnabled: ref(swipeEnabled),
    onSwipe,
    onVerticalClose: () => { throw new Error('Pinch must not close') },
  }))!
  const pointer = (id: number, x: number, y = 250) => ({
    pointerId: id,
    pointerType: 'touch',
    clientX: x,
    clientY: y,
  }) as PointerEvent
  return { transform, pointer, onSwipe, dispose: () => scope.stop() }
}

test('pinch holds its image focal point and hands off to one-finger panning', (t) => {
  const f = fixture()
  t.onTestFinished(f.dispose)
  const { transform: g, pointer: p } = f
  g.handlePointerDown(p(1, 300))
  g.handlePointerDown(p(2, 400))
  g.handlePointerMove(p(1, 250))
  g.handlePointerMove(p(2, 450))
  expect(g.scale.value).toBe(2)
  expect(g.tx.value).toBe(-50)
  expect(g.ty.value).toBe(0)
  g.handlePointerUp(p(2, 450))
  g.handlePointerMove(p(1, 280))
  expect(g.tx.value).toBe(-20)
  g.handlePointerUp(p(1, 280))
  expect(g.scale.value).toBe(2)
  expect(g.dragging.value).toBe(false)
  expect(g.ignoreClick.value).toBe(true)
  expect(f.onSwipe).not.toHaveBeenCalled()
})

test('zoom disabled prevents pinch scaling', (t) => {
  const f = fixture(false)
  t.onTestFinished(f.dispose)
  const { transform: g, pointer: p } = f
  g.handlePointerDown(p(1, 300))
  g.handlePointerDown(p(2, 400))
  g.handlePointerMove(p(1, 200))
  g.handlePointerMove(p(2, 500))
  g.handlePointerUp(p(1, 200))
  g.handlePointerUp(p(2, 500))
  expect(g.scale.value).toBe(1)
  expect(g.tx.value).toBe(0)
})

test('single fitted image stays stationary while zoomed panning remains available', (t) => {
  const f = fixture(true, false)
  t.onTestFinished(f.dispose)
  const { transform: g, pointer: p } = f
  g.handlePointerDown(p(1, 300))
  g.handlePointerMove(p(1, 160, 380))
  expect([g.tx.value, g.ty.value, g.dragRotate.value]).toEqual([0, 0, 0])
  expect(g.dragging.value).toBe(false)
  g.handlePointerUp(p(1, 160, 380))
  expect(g.settling.value).toBe(false)
  expect(g.ignoreClick.value).toBe(true)
  expect(f.onSwipe).not.toHaveBeenCalled()
  g.setTransform(2, 0, 0)
  g.handlePointerDown(p(2, 300))
  g.handlePointerMove(p(2, 260, 280))
  expect([g.tx.value, g.ty.value]).toEqual([-40, 30])
  g.handlePointerUp(p(2, 260, 280))
})

test('horizontal drag locks its axis and suppresses click zoom', (t) => {
  const f = fixture()
  t.onTestFinished(f.dispose)
  const { transform: g, pointer: p } = f
  g.handlePointerDown(p(1, 300))
  g.handlePointerMove(p(1, 297, 252))
  expect([g.tx.value, g.ty.value]).toEqual([0, 0])
  g.handlePointerMove(p(1, 240, 265))
  expect([g.tx.value, g.ty.value, g.dragRotate.value]).toEqual([-60, 0, 0])
  expect(g.dragging.value).toBe(true)
  g.handlePointerMove(p(1, 180, 300))
  expect(g.ty.value).toBe(0)
  g.handlePointerUp(p(1, 180, 300))
  expect(g.ignoreClick.value).toBe(true)
  expect(f.onSwipe).toHaveBeenCalledExactlyOnceWith(1, -120)
})
