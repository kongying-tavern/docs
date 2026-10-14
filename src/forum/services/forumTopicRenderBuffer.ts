import type { Range, VirtualItem } from '@tanstack/vue-virtual'

const MAX_BUFFER_ROWS = 36
const MAX_RETIRED_ROWS = 12

/** Pixel coverage follows measured heights; caps keep rich DOM independent of list length. */
export function forumTopicRenderDistance(viewport: number, velocity: number, commitToFrameMs: number) {
  const base = viewport * 0.75
  const ahead = Math.min(viewport * 3, base + Math.abs(velocity) * (commitToFrameMs + 50))
  // Quarter-screen steps avoid changing virtualizer options for every scroll pixel.
  const distance = Math.ceil(ahead / Math.max(1, viewport / 4)) * viewport / 4
  return velocity > 0
    ? { before: viewport / 2, after: distance }
    : velocity < 0 ? { before: distance, after: viewport / 2 } : { before: base, after: base }
}

export function forumTopicRenderIndexes(
  range: Range,
  measurements: readonly VirtualItem[],
  options: { offset: number, viewport: number, before: number, after: number, retained: readonly VirtualItem[], focusedIndex: number },
): number[] {
  let start = range.startIndex
  let end = range.endIndex
  const requestedLimit = Math.max(MAX_BUFFER_ROWS, end - start + 1)
  const extendBefore = () => {
    while (start > 0 && end - start + 1 < requestedLimit && measurements[start].start > options.offset - options.before)
      start--
  }
  const extendAfter = () => {
    while (end < range.count - 1 && end - start + 1 < requestedLimit && measurements[end].end < options.offset + options.viewport + options.after)
      end++
  }
  if (options.before > options.after) {
    extendBefore()
    extendAfter()
  }
  else {
    extendAfter()
    extendBefore()
  }
  const indexes = new Set(Array.from({ length: end - start + 1 }, (_, index) => start + index))
  const distance = (row: VirtualItem) => Math.max(0, options.offset - row.end, row.start - options.offset - options.viewport)
  const retired = options.retained
    .filter(row => !indexes.has(row.index) && distance(row) <= options.viewport * 2)
    .toSorted((a, b) => distance(a) - distance(b))
    .slice(0, Math.min(MAX_RETIRED_ROWS, Math.max(0, MAX_BUFFER_ROWS + MAX_RETIRED_ROWS - indexes.size)))
  for (const row of retired)
    indexes.add(row.index)
  if (options.focusedIndex >= 0)
    indexes.add(options.focusedIndex)
  return [...indexes].toSorted((a, b) => a - b)
}
