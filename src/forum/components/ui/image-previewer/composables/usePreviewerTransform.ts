import type { Ref } from 'vue'
import { onScopeDispose, ref } from 'vue'

export interface PreviewerTransform {
  scale: Ref<number>
  tx: Ref<number>
  ty: Ref<number>
  dragRotate: Ref<number>
  settling: Ref<boolean>
}

/**
 * 图片预览的缩放/平移状态与指针手势（滚轮、双击、捏合、拖拽、滑动切图）。
 * 缩放以指针位置为焦点保持；滑动判定不采用 usePointerSwipe —— 它会强制
 * 设置 touch-action: pan-y 并只在越过阈值时回调，与移动端手势冲突。
 */
export function usePreviewerTransform(options: {
  maxZoom: Ref<number>
  imageEl: Readonly<Ref<HTMLImageElement | null | undefined>>
  zoomEnabled: Ref<boolean>
  onSwipe: (direction: 1 | -1, dx: number) => void
  onVerticalClose?: () => void
}): PreviewerTransform & {
  zoomAt: (clientX: number, clientY: number, factor: number) => void
  reset: () => void
  setTransform: (s: number, x: number, y: number) => void
  dragging: Ref<boolean>
  ignoreClick: Ref<boolean>
  touchInput: Ref<boolean>
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
  const ignoreClick = ref(false)
  const touchInput = ref(false)
  const dragRotate = ref(0)
  const settling = ref(false)
  let settleTimer: number | undefined
  let pressed = false

  const pointers = new Map<number, { x: number, y: number }>()
  let pinchStart: { dist: number, scale: number, x: number, y: number, tx: number, ty: number, cx: number, cy: number } | null = null
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
    dragRotate.value = 0
    scale.value = ns
    tx.value = ptx
    ty.value = pty
  }

  function reset(): void {
    dragRotate.value = 0
    scale.value = 1
    tx.value = 0
    ty.value = 0
  }

  function relax(): void {
    dragging.value = false
    settling.value = true
    clearTimeout(settleTimer)
    settleTimer = window.setTimeout(() => {
      settling.value = false
    }, 420)
    reset()
  }

  function setTransform(s: number, x: number, y: number): void {
    dragRotate.value = 0
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
    if (event.pointerType === 'mouse' && event.button !== 0)
      return
    if (pointers.size === 0) {
      ignoreClick.value = false
      touchInput.value = event.pointerType === 'touch'
    }
    // 回弹途中再次按下：立即中断过渡，避免跟随延迟
    clearTimeout(settleTimer)
    settling.value = false
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    pressed = true
    if (pointers.size === 2 && options.zoomEnabled.value) {
      const [a, b] = [...pointers.values()]
      const rect = options.imageEl.value?.getBoundingClientRect()
      pinchStart = {
        dist: Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1),
        scale: scale.value,
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        tx: tx.value,
        ty: ty.value,
        cx: rect ? rect.left + rect.width / 2 - tx.value : 0,
        cy: rect ? rect.top + rect.height / 2 - ty.value : 0,
      }
      ignoreClick.value = true
      dragRotate.value = 0
      dragStart = null
      return
    }
    if (pointers.size > 1) {
      dragStart = null
      ignoreClick.value = true
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
      const s = Math.min(Math.max(pinchStart.scale * factor, 1), options.maxZoom.value)
      const k = s / pinchStart.scale
      // 保持双指起始焦点对应的图片内容，并叠加双指中心的平移。
      const nx = pinchStart.tx * k + (1 - k) * (pinchStart.x - pinchStart.cx) + cx - pinchStart.x
      const ny = pinchStart.ty * k + (1 - k) * (pinchStart.y - pinchStart.cy) + cy - pinchStart.y
      const [, x, y] = clampTransform(s, nx, ny)
      scale.value = s
      tx.value = x
      ty.value = y
      dragging.value = true
      return
    }

    if (!dragStart)
      return
    const dx = event.clientX - dragStart.x
    const dy = event.clientY - dragStart.y
    if (Math.abs(dx) + Math.abs(dy) >= 6)
      ignoreClick.value = true
    if (scale.value > 1) {
      const [s, nx, ny] = clampTransform(scale.value, dragStart.tx + dx, dragStart.ty + dy)
      scale.value = s
      tx.value = nx
      ty.value = ny
      return
    }
    tx.value = dragStart.tx + dx
    ty.value = dragStart.ty + dy
    dragRotate.value = Math.min(Math.max(dx * 0.05, -10), 10)
  }

  function handlePointerUp(event: PointerEvent): void {
    if (!pointers.has(event.pointerId))
      return
    pointers.delete(event.pointerId)
    if (event.type === 'pointercancel') {
      pointers.clear()
      pinchStart = null
      dragStart = null
      pressed = false
      dragging.value = false
      ignoreClick.value = true
      if (scale.value === 1)
        relax()
      return
    }
    if (pinchStart || pointers.size > 0) {
      pinchStart = null
      const remaining = [...pointers.values()][0]
      dragStart = remaining && scale.value > 1
        ? { ...remaining, tx: tx.value, ty: ty.value, time: Date.now() }
        : null
      pressed = Boolean(remaining)
      dragging.value = Boolean(remaining) && scale.value > 1
      return
    }
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
        options.onSwipe(dx < 0 ? 1 : -1, dx)
        return
      }
      if (event.pointerType === 'touch' && Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx) * 1.3) {
        options.onVerticalClose?.()
        return
      }
      if (Math.abs(dx) + Math.abs(dy) < 6) {
        // 纯点击不算拖拽，直接复位，不触发回弹过渡
        reset()
        return
      }
      relax()
    }
  }

  onScopeDispose(() => {
    clearTimeout(settleTimer)
  })

  return {
    scale,
    tx,
    ty,
    dragRotate,
    settling,
    zoomAt,
    reset,
    setTransform,
    dragging,
    ignoreClick,
    touchInput,
    handleWheel,
    handleDoubleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
