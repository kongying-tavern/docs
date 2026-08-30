import type { Ref } from 'vue'
import { ref } from 'vue'

export interface PreviewerTransform {
  scale: Ref<number>
  tx: Ref<number>
  ty: Ref<number>
}

/**
 * 图片预览的缩放/平移状态与指针手势（滚轮、双击、捏合、拖拽、滑动切图）。
 * 缩放以指针位置为焦点保持；滑动判定不采用 usePointerSwipe —— 它会强制
 * 设置 touch-action: pan-y 并只在越过阈值时回调，与移动端手势冲突。
 */
export function usePreviewerTransform(options: {
  maxZoom: Ref<number>
  imageEl: Ref<HTMLImageElement | undefined>
  zoomEnabled: Ref<boolean>
  onSwipe: (direction: 1 | -1) => void
  onVerticalClose?: () => void
}): PreviewerTransform & {
  zoomAt: (clientX: number, clientY: number, factor: number) => void
  reset: () => void
  setTransform: (s: number, x: number, y: number) => void
  dragging: Ref<boolean>
  handlePointerDown: (event: PointerEvent) => void
  handlePointerMove: (event: PointerEvent) => void
  handlePointerUp: (event: PointerEvent) => void
  handleWheel: (event: WheelEvent) => void
  handleDoubleClick: (event: MouseEvent) => void
} {
  const scale = ref(1)
  const tx = ref(0)
  const ty = ref(0)
  const dragging = ref(false)
  let pressed = false

  const pointers = new Map<number, { x: number, y: number }>()
  let pinchStart: { dist: number, scale: number } | null = null
  let dragStart: { x: number, y: number, tx: number, ty: number, time: number } | null = null

  function clampTransform(s: number, x: number, y: number): [number, number, number] {
    const img = options.imageEl.value
    if (!img)
      return [s, x, y]
    const w = img.offsetWidth
    const h = img.offsetHeight
    const maxX = Math.max((w * (s - 1)) / 2, 0)
    const maxY = Math.max((h * (s - 1)) / 2, 0)
    return [s, Math.min(Math.max(x, -maxX), maxX), Math.min(Math.max(y, -maxY), maxY)]
  }

  function zoomAt(clientX: number, clientY: number, factor: number): void {
    const img = options.imageEl.value
    if (!img)
      return
    // 以图片实际显示区域中心为变换中心（侧边面板留白时窗口中心会偏移）
    const rect = img.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const s = Math.min(Math.max(scale.value * factor, 1), options.maxZoom.value)
    const k = s / scale.value
    const nx = (1 - k) * (clientX - cx) + tx.value * k
    const ny = (1 - k) * (clientY - cy) + ty.value * k
    const [ns, ptx, pty] = clampTransform(s, nx, ny)
    scale.value = ns
    tx.value = ptx
    ty.value = pty
  }

  function reset(): void {
    scale.value = 1
    tx.value = 0
    ty.value = 0
  }

  function setTransform(s: number, x: number, y: number): void {
    scale.value = s
    tx.value = x
    ty.value = y
  }

  function handleWheel(event: WheelEvent): void {
    if (!options.zoomEnabled.value)
      return
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.0015))
  }

  function handleDoubleClick(event: MouseEvent): void {
    if (!options.zoomEnabled.value)
      return
    if (scale.value > 1)
      reset()
    else
      zoomAt(event.clientX, event.clientY, 2.5)
  }

  function handlePointerDown(event: PointerEvent): void {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    pressed = true
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: scale.value }
      dragStart = null
      return
    }
    dragStart = { x: event.clientX, y: event.clientY, tx: tx.value, ty: ty.value, time: Date.now() }
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!pointers.has(event.pointerId))
      return
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    dragging.value = pressed && scale.value > 1

    if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const factor = dist / pinchStart.dist
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      scale.value = Math.min(Math.max(pinchStart.scale * factor, 1), options.maxZoom.value)
      tx.value = (cx - window.innerWidth / 2) * 0.35
      ty.value = (cy - window.innerHeight / 2) * 0.35
      return
    }

    if (!dragStart)
      return
    const dx = event.clientX - dragStart.x
    const dy = event.clientY - dragStart.y
    if (scale.value > 1) {
      const [s, nx, ny] = clampTransform(scale.value, dragStart.tx + dx, dragStart.ty + dy)
      scale.value = s
      tx.value = nx
      ty.value = ny
      return
    }
    tx.value = dragStart.tx + dx
    ty.value = dragStart.ty + dy
  }

  function handlePointerUp(event: PointerEvent): void {
    pointers.delete(event.pointerId)
    if (pointers.size < 2)
      pinchStart = null
    if (pointers.size === 0) {
      pressed = false
      dragging.value = false
    }
    if (!dragStart)
      return
    const dx = event.clientX - dragStart.x
    const dy = event.clientY - dragStart.y
    const dt = Date.now() - dragStart.time
    dragStart = null

    if (scale.value === 1) {
      const horizontal = Math.abs(dx) > Math.abs(dy) * 1.3
      const quickSwipe = horizontal && Math.abs(dx) > 40 && dt < 300
      if (horizontal && (Math.abs(dx) > 80 || quickSwipe)) {
        options.onSwipe(dx < 0 ? 1 : -1)
        return
      }
      if (event.pointerType === 'touch' && Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx) * 1.3) {
        options.onVerticalClose?.()
        return
      }
      reset()
    }
  }

  return {
    scale,
    tx,
    ty,
    zoomAt,
    reset,
    setTransform,
    dragging,
    handleWheel,
    handleDoubleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
