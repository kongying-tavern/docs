import type { Range, Virtualizer } from '@tanstack/vue-virtual'
import type { Ref } from 'vue'
import { observeWindowOffset } from '@tanstack/vue-virtual'
import { computed, nextTick, onScopeDispose, shallowRef } from 'vue'
import { forumTopicRenderDistance, forumTopicRenderIndexes } from '~/forum/services/forumTopicRenderBuffer'

const RECLAIM_QUIET_MS = 250
const RECLAIM_IDLE_TIMEOUT_MS = 1000

export function useForumTopicRenderBuffer(active: Ref<boolean>, focusedId: Ref<string | undefined>, indexById: Map<string, number>) {
  const buffer = shallowRef({ before: 0, after: 0 })
  let retainedIds = new Set<string>()
  let velocity = 0
  let commitToFrameMs = 32
  let viewport = 0
  let lastOffset: number | undefined
  let lastScrollAt = 0
  let sizeAdjustment = 0
  let recycleTimer: ReturnType<typeof setTimeout> | undefined
  let recycleIdle: number | undefined
  let commitFrame = 0
  let generation = 0

  function cancelRecycle(): void {
    clearTimeout(recycleTimer)
    if (recycleIdle !== undefined)
      window.cancelIdleCallback(recycleIdle)
    recycleIdle = undefined
  }

  function updateBuffer(): void {
    const next = forumTopicRenderDistance(viewport, velocity, commitToFrameMs)
    if (next.before !== buffer.value.before || next.after !== buffer.value.after)
      buffer.value = next
  }

  function recycle(): void {
    recycleIdle = undefined
    if (!active.value)
      return
    retainedIds.clear()
    velocity = 0
    // A new extractor identity invalidates TanStack's memo even after scrolling stops.
    buffer.value = forumTopicRenderDistance(viewport, velocity, commitToFrameMs)
  }

  function scheduleRecycle(): void {
    cancelRecycle()
    // Only disposal waits for idle. Visible and ahead rows mount immediately.
    recycleTimer = setTimeout(() => {
      if ('requestIdleCallback' in window)
        recycleIdle = window.requestIdleCallback(recycle, { timeout: RECLAIM_IDLE_TIMEOUT_MS })
      else
        recycle()
    }, RECLAIM_QUIET_MS)
  }

  const extract = computed(() => {
    const { before, after } = buffer.value
    const focusedIndex = focusedId.value === undefined ? -1 : indexById.get(focusedId.value) ?? -1
    return (range: Range, instance: Virtualizer<Window, HTMLElement>) => {
      const height = instance.scrollRect?.height ?? 0
      const retained = [...retainedIds].flatMap((id) => {
        const index = indexById.get(id)
        const row = index === undefined ? undefined : instance.measurementsCache[index]
        return row?.key === id ? [row] : []
      })
      return forumTopicRenderIndexes(range, instance.measurementsCache, {
        offset: instance.scrollOffset ?? 0,
        viewport: height,
        before: before || height * 0.75,
        after: after || height * 0.75,
        retained,
        focusedIndex,
      })
    }
  })

  const observeOffset: typeof observeWindowOffset = (instance, callback) => observeWindowOffset(instance, (offset, scrolling) => {
    const now = performance.now()
    const delta = lastOffset === undefined ? 0 : offset - lastOffset - sizeAdjustment
    sizeAdjustment = 0
    viewport = instance.scrollRect?.height ?? window.innerHeight
    if (scrolling && Math.abs(delta) > 1) {
      const speed = delta / Math.max(16, now - lastScrollAt)
      velocity = Math.sign(speed) !== Math.sign(velocity) || now - lastScrollAt > RECLAIM_QUIET_MS
        ? speed
        : velocity * 0.5 + speed * 0.5
      updateBuffer()
      scheduleRecycle()
    }
    lastOffset = offset
    lastScrollAt = now
    callback(offset, scrolling)
  })

  function recordRows(ids: string[], previous: string[] | undefined): void {
    if (!active.value || (previous && ids.length === previous.length && ids.every((id, index) => id === previous[index])))
      return
    retainedIds = new Set(ids)
    scheduleRecycle()
    const previousIds = new Set(previous)
    if (!ids.some(id => !previousIds.has(id)))
      return
    const started = performance.now()
    const sample = ++generation
    cancelAnimationFrame(commitFrame)
    void nextTick(() => {
      if (sample !== generation || !active.value)
        return
      commitFrame = requestAnimationFrame(() => {
        // Includes Vue's commit and frame queueing, rather than just component CPU time.
        commitToFrameMs = Math.min(160, Math.max(16, commitToFrameMs * 0.75 + (performance.now() - started) * 0.25))
      })
    })
  }

  function invalidate(): void {
    retainedIds = new Set([...retainedIds].filter(id => indexById.has(id)))
    buffer.value = { ...buffer.value }
  }

  function reset(): void {
    generation++
    cancelRecycle()
    cancelAnimationFrame(commitFrame)
    retainedIds.clear()
    lastOffset = undefined
    velocity = sizeAdjustment = 0
    buffer.value = { before: 0, after: 0 }
  }
  onScopeDispose(reset)

  function resize(height: number): void {
    viewport = height
    updateBuffer()
  }

  return { extract, observeOffset, recordRows, invalidate, reset, resize, adjust: (delta: number) => sizeAdjustment += delta }
}
