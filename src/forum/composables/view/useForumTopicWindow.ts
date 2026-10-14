import type { VirtualItem, Virtualizer } from '@tanstack/vue-virtual'
import type { ComponentPublicInstance, Ref } from 'vue'
import type ForumAPI from '~/forum/api/types'
import { useWindowVirtualizer } from '@tanstack/vue-virtual'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { useForumViewMode } from '~/forum/composables/state/useForumViewMode'
import { useForumTopicRenderBuffer } from '~/forum/composables/view/useForumTopicRenderBuffer'
import { layoutTop } from '~/forum/utils/layoutPosition'

export function useForumTopicWindow(data: () => ForumAPI.Topic[], active: Ref<boolean>) {
  const root = shallowRef<HTMLElement>()
  const windowed = ref(false)
  const observing = ref(true)
  const retainedHeight = ref(0)
  const margin = ref(0)
  const initialMeasurements = shallowRef<VirtualItem[]>([])
  const measuredSizes = new Map<string, number>()
  const focusedId = ref<string>()
  const indexById = new Map<string, number>()
  const renderBuffer = useForumTopicRenderBuffer(active, focusedId, indexById)
  let restoringAnchor = false
  let displayChange = 0
  const { isCompactMode } = useForumViewMode()
  const estimateSize = () => isCompactMode.value ? 180 : 380
  // Changing this identity invalidates every measurement in TanStack 3.13.12.
  const getItemKey = (index: number) => data()[index].id

  function updateMargin(): void {
    if (!root.value || !active.value)
      return
    // Ancestor page-entry transforms must not change the virtual list's layout origin.
    margin.value = layoutTop(root.value)
  }

  const virtualizer: Ref<Virtualizer<Window, HTMLElement>> = useWindowVirtualizer<HTMLElement>(computed(() => {
    const extract = renderBuffer.extract.value
    return {
      count: data().length,
      enabled: !import.meta.env.SSR && windowed.value && active.value && observing.value,
      getItemKey,
      estimateSize,
      scrollMargin: margin.value,
      initialMeasurementsCache: initialMeasurements.value,
      overscan: 0,
      rangeExtractor: range => extract(range, virtualizer.value),
      observeElementOffset: renderBuffer.observeOffset,
      measureElement: (element, entry, instance) => {
        // Ref callbacks run between DOM insertions. Reading offsetHeight there
        // forces a layout for every row. ResizeObserver measures the completed
        // batch; until then, preserve the cached/estimated height.
        const id = element.dataset.topicId!
        const size = entry ? Math.round(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height) : 0
        if (size > 0) {
          measuredSizes.set(id, size)
          return size
        }
        const cached = instance.measurementsCache[Number(element.dataset.index)]
        return measuredSizes.get(id) ?? (cached?.key === id ? cached.size : estimateSize())
      },
      useAnimationFrameWithResizeObserver: true,
    }
  }))
  virtualizer.value.shouldAdjustScrollPositionOnItemSizeChange = (item, delta, instance) => {
    const adjust = !restoringAnchor && item.start < (instance.scrollOffset ?? 0)
    if (adjust)
      renderBuffer.adjust(delta)
    return adjust
  }

  function setRoot(element: Element | ComponentPublicInstance | null): void {
    const next = (element && '$el' in element ? element.$el : element) as HTMLElement | undefined
    if (next === root.value)
      return
    root.value = next
    updateMargin()
  }

  function seedMeasurements(sizes: Map<string, number>): VirtualItem[] {
    let start = margin.value
    return data().map((item, index) => {
      const size = sizes.get(item.id) ?? estimateSize()
      const measurement = { key: item.id, index, start, size, end: start + size, lane: 0 }
      start += size
      return measurement
    })
  }

  watch(() => data().map(topic => topic.id), (ids) => {
    const count = ids.length
    if (import.meta.env.SSR)
      return
    indexById.clear()
    ids.forEach((id, index) => indexById.set(id, index))
    renderBuffer.invalidate()
    const currentIds = new Set(ids)
    for (const id of measuredSizes.keys()) {
      if (!currentIds.has(id))
        measuredSizes.delete(id)
    }
    // The virtualizer retains sizes by identity even when a query replaces its rows.
    if (virtualizer.value.measurementsCache.some(row => row.key !== ids[row.index])) {
      const instance = virtualizer.value
      const sizes = new Map([...initialMeasurements.value, ...instance.measurementsCache]
        .filter(row => currentIds.has(String(row.key)))
        .map(row => [String(row.key), row.size]))
      initialMeasurements.value = seedMeasurements(sizes)
      retainedHeight.value = (initialMeasurements.value.at(-1)?.end ?? margin.value) - margin.value
      // Disabling clears identity caches through the public API. Re-enable with
      // surviving measurements, so deleting one row does not discard every height.
      const options = instance.options
      instance.setOptions({ ...options, enabled: false })
      instance.getTotalSize()
      instance.setOptions({ ...options, count, initialMeasurementsCache: initialMeasurements.value })
      instance.getTotalSize()
    }
    initialMeasurements.value = initialMeasurements.value.filter(row => currentIds.has(String(row.key)))
    if (count <= 80) {
      windowed.value = false
      initialMeasurements.value = []
    }
    else if (!windowed.value) {
      updateMargin()
      const sizes = new Map([...root.value?.querySelectorAll<HTMLElement>('li[data-topic-id]') ?? []]
        .map(row => [row.dataset.topicId!, row.getBoundingClientRect().height]))
      for (const [id, size] of sizes)
        measuredSizes.set(id, size)
      initialMeasurements.value = seedMeasurements(sizes)
      windowed.value = true
    }
  }, { immediate: true })

  watch(active, async (enabled) => {
    if (!enabled) {
      displayChange++
      restoringAnchor = false
      renderBuffer.reset()
    }
    if (!enabled && windowed.value) {
      initialMeasurements.value = virtualizer.value.measurementsCache.slice()
      retainedHeight.value = (initialMeasurements.value.at(-1)?.end ?? margin.value) - margin.value
      observing.value = false
    }
    if (enabled) {
      await nextTick()
      updateMargin()
      // The router restores history scrolling after activation; do not measure temporary top rows.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      observing.value = active.value
    }
  }, { flush: 'sync' })

  let marginFrame = 0
  useResizeObserver(root, () => {
    cancelAnimationFrame(marginFrame)
    marginFrame = requestAnimationFrame(updateMargin)
  })
  onScopeDispose(() => {
    displayChange++
    active.value = false
    cancelAnimationFrame(marginFrame)
  })
  useEventListener(import.meta.env.SSR ? undefined : window, 'resize', () => {
    updateMargin()
    renderBuffer.resize(window.innerHeight)
  }, { passive: true })
  const syncFocus = () => {
    const target = root.value?.contains(document.activeElement)
      ? document.activeElement
      : root.value?.querySelector('[aria-expanded="true"]')
    focusedId.value = target?.closest<HTMLElement>('li[data-topic-id]')?.dataset.topicId
  }
  useEventListener(root, 'focusin', syncFocus)
  useEventListener(root, 'focusout', () => void nextTick(syncFocus))

  watch(isCompactMode, async () => {
    if (!windowed.value || !active.value)
      return
    const anchor = [...root.value?.querySelectorAll<HTMLElement>('li[data-topic-id]') ?? []]
      .find(row => row.getBoundingClientRect().bottom > 0)
    const index = Number(anchor?.dataset.index)
    const top = anchor?.getBoundingClientRect().top ?? 0
    const change = ++displayChange
    renderBuffer.reset()
    restoringAnchor = true
    initialMeasurements.value = []
    measuredSizes.clear()
    virtualizer.value.measure()
    await nextTick()
    if (change !== displayChange || !active.value)
      return
    if (anchor && Number.isFinite(index)) {
      const offset = virtualizer.value.getOffsetForIndex(index, 'start')?.[0]
      if (offset !== undefined)
        window.scrollTo({ top: offset - top, behavior: 'instant' })
      let stable = 0
      for (let frame = 0; frame < 8 && stable < 2 && active.value; frame++) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        if (change !== displayChange || !active.value)
          break
        const row = root.value?.querySelector<HTMLElement>(`li[data-index="${index}"]`)
        if (!row)
          break
        const delta = row.getBoundingClientRect().top - top
        if (Math.abs(delta) > 1) {
          window.scrollBy({ top: delta, behavior: 'instant' })
          stable = 0
        }
        else {
          stable++
        }
      }
    }
    if (change === displayChange)
      restoringAnchor = false
  })

  const rows = computed(() => windowed.value
    ? virtualizer.value.getVirtualItems().map(row => ({ item: data()[row.index], index: row.index, start: row.start - margin.value }))
    : data().map((item, index) => ({ item, index, start: undefined })))
  watch(() => rows.value.map(row => row.item.id), (ids, previous) => {
    if (windowed.value)
      renderBuffer.recordRows(ids, previous)
  })
  const height = computed(() => windowed.value
    ? observing.value && active.value ? virtualizer.value.getTotalSize() : retainedHeight.value
    : undefined)

  function measureRow(element: Element | ComponentPublicInstance | null): void {
    if (windowed.value)
      virtualizer.value.measureElement(element as HTMLElement | null)
  }

  return { rows, windowed, height, setRoot, measureRow }
}
