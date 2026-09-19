export interface ItemRect {
  top: number
  height: number
  left: number
  width: number
}

export type FluidHoverAxis = 'x' | 'y' | 'xy'

export interface PickNearestInput {
  axis: FluidHoverAxis
  /** The pointer, in viewport coordinates. */
  point: { x: number, y: number }
  /** Item rects in the container's layout space (sparse: unmeasured slots are undefined). */
  rects: readonly (ItemRect | undefined)[]
  /** The container's viewport rect, which maps layout rects into the pointer's space. */
  containerRect: { left: number, top: number, width: number, height: number }
  scroll: { x: number, y: number }
  border: { x: number, y: number }
  /** Layout size of the container, so a cumulative ancestor `transform: scale` factors out per axis. */
  layoutSize: { width: number, height: number }
  /**
   * Container-space visible window (scrollLeft..scrollLeft+clientWidth): rects outside it are
   * skipped, and mostly-clipped rects only win when no mostly-visible one exists.
   */
  view?: { x: number, y: number, width: number, height: number }
  /** Skips an item without removing it from the rect set. */
  isDisabled?: (index: number) => boolean
}

/**
 * The selection rule as one pure function: an item the pointer is inside wins; otherwise the item
 * whose center is nearest does, so a pointer in a gap, in the padding, or past the last row still
 * lands. `y` and `x` measure one coordinate; `xy` measures squared distance to each center (no
 * `sqrt`). Ties keep the first item.
 */
export function pickNearest({
  axis,
  point,
  rects,
  containerRect,
  scroll,
  border,
  layoutSize,
  view,
  isDisabled,
}: PickNearestInput): number | null {
  const scaleX = layoutSize.width > 0 ? containerRect.width / layoutSize.width : 1
  const scaleY = layoutSize.height > 0 ? containerRect.height / layoutSize.height : 1
  let bestIndex = -1
  let bestDistance = Number.POSITIVE_INFINITY
  let clippedIndex = -1
  let clippedDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < rects.length; index++) {
    const rect = rects[index]
    if (!rect || isDisabled?.(index))
      continue

    let mostlyHidden = false
    if (view) {
      const visibleWidth = Math.min(rect.left + rect.width, view.x + view.width) - Math.max(rect.left, view.x)
      const visibleHeight = Math.min(rect.top + rect.height, view.y + view.height) - Math.max(rect.top, view.y)
      if (visibleWidth <= 0 || visibleHeight <= 0)
        continue
      mostlyHidden = visibleWidth < rect.width / 2 || visibleHeight < rect.height / 2
    }

    const horizontal = axis === 'x'
    const vertical = axis === 'y'
    const left = containerRect.left + (border.x + rect.left - scroll.x) * scaleX
    const top = containerRect.top + (border.y + rect.top - scroll.y) * scaleY
    const width = rect.width * scaleX
    const height = rect.height * scaleY

    // An item the pointer is inside wins over every distance; the first one keeps it.
    const containing = horizontal
      ? point.x >= left && point.x <= left + width
      : vertical
        ? point.y >= top && point.y <= top + height
        : point.x >= left && point.x <= left + width && point.y >= top && point.y <= top + height
    if (containing)
      return index

    let distance: number
    if (axis === 'xy') {
      const dx = point.x - (left + width / 2)
      const dy = point.y - (top + height / 2)
      distance = dx * dx + dy * dy
    }
    else {
      distance = Math.abs((horizontal ? point.x : point.y) - (horizontal ? left + width / 2 : top + height / 2))
    }
    if (mostlyHidden) {
      if (distance < clippedDistance) {
        clippedDistance = distance
        clippedIndex = index
      }
    }
    else if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex >= 0 ? bestIndex : clippedIndex >= 0 ? clippedIndex : null
}
