import { expect, test } from 'vitest'
import { effectScope, ref, shallowRef } from 'vue'
import { usePreviewerTransform } from '../../src/forum/components/ui/image-previewer/composables/usePreviewerTransform'

function fixture(zoomEnabled = true) {
  const scope = effectScope()
  const image = {
    offsetWidth: 400,
    offsetHeight: 300,
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 400, height: 300 }),
  } as HTMLImageElement
  const transform = scope.run(() => usePreviewerTransform({
    maxZoom: ref(4),
    imageEl: shallowRef(image),
    zoomEnabled: ref(zoomEnabled),
    onSwipe: () => { throw new Error('Pinch must not swipe') },
    onVerticalClose: () => { throw new Error('Pinch must not close') },
  }))!
  const pointer = (id: number, x: number, y = 250) => ({
    pointerId: id,
    pointerType: 'touch',
    clientX: x,
    clientY: y,
  }) as PointerEvent
  return { transform, pointer, dispose: () => scope.stop() }
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
