import type { Ref } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'

/** Keep the mobile editor inside the visible area above the software keyboard. */
export function useMobileEditorViewport(isOpen: Ref<boolean>, isDesktop: Ref<boolean>, root: Readonly<Ref<HTMLElement | null>>, bodySelector: string) {
  const height = ref<number>()
  const bottom = ref(0)
  const keyboardVisible = ref(false)
  const drawerStyle = computed(() => height.value === undefined
    ? undefined
    : {
        '--compact-viewport-height': `${height.value}px`,
        '--compact-viewport-bottom': `${bottom.value}px`,
      })

  watch([isOpen, isDesktop], ([open, desktop], _, onCleanup) => {
    height.value = undefined
    bottom.value = 0
    keyboardVisible.value = false
    if (!open || desktop || typeof window === 'undefined')
      return

    const viewport = window.visualViewport
    let fullHeight = window.innerHeight
    let fullWidth = window.innerWidth
    let frame = 0
    let caretFrame = 0
    let active = true

    function keepCaretVisible() {
      const element = document.activeElement
      const body = root.value?.querySelector<HTMLElement>(bodySelector)
      if (!(element instanceof HTMLElement) || !body?.contains(element))
        return
      let caret: Range | undefined
      if (element.isContentEditable) {
        const selection = window.getSelection()
        if (!selection?.rangeCount || !element.contains(selection.anchorNode))
          return
        caret = selection.getRangeAt(0).cloneRange()
        caret.collapse(false)
      }
      // The rich editor can scroll too. Reveal the caret there first, then in
      // the form body; never scroll the clipped drawer or the background page.
      for (let scroller: HTMLElement | null = element; scroller; scroller = scroller.parentElement) {
        const overflow = getComputedStyle(scroller).overflowY
        if (scroller === body || overflow === 'auto' || overflow === 'scroll') {
          const rect = caret ? caret.getClientRects()[0] : element.getBoundingClientRect()
          if (!rect?.height)
            return
          const bounds = scroller.getBoundingClientRect()
          const padding = 12
          if (rect.bottom > bounds.bottom - padding)
            scroller.scrollTop += rect.bottom - bounds.bottom + padding
          else if (rect.top < bounds.top + padding)
            scroller.scrollTop += rect.top - bounds.top - padding
        }
        if (scroller === body)
          break
      }
    }

    function update() {
      // Pinch zoom also shrinks the visual viewport; keep its native behavior.
      if (viewport && Math.abs(viewport.scale - 1) > 0.01)
        return
      const visibleHeight = viewport?.height ?? window.innerHeight
      if (Math.abs(window.innerWidth - fullWidth) > 50) {
        fullWidth = window.innerWidth
        fullHeight = window.innerHeight
      }
      const element = document.activeElement
      const editing = element instanceof HTMLElement && root.value?.contains(element)
        && (element.matches('input, textarea') || element.isContentEditable)
      const deficit = fullHeight - visibleHeight
      keyboardVisible.value = keyboardVisible.value ? deficit > 60 : Boolean(editing && deficit > 120)
      if (!keyboardVisible.value && !editing)
        fullHeight = Math.max(window.innerHeight, visibleHeight)
      height.value = visibleHeight
      bottom.value = Math.max(0, window.innerHeight - visibleHeight - (viewport?.offsetTop ?? 0))
      cancelAnimationFrame(caretFrame)
      void nextTick(() => {
        if (active)
          caretFrame = requestAnimationFrame(keepCaretVisible)
      })
    }

    function scheduleUpdate() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    viewport?.addEventListener('resize', scheduleUpdate)
    viewport?.addEventListener('scroll', scheduleUpdate)
    window.addEventListener('resize', scheduleUpdate)
    document.addEventListener('focusin', scheduleUpdate)
    document.addEventListener('selectionchange', scheduleUpdate)
    update()
    onCleanup(() => {
      active = false
      cancelAnimationFrame(frame)
      cancelAnimationFrame(caretFrame)
      viewport?.removeEventListener('resize', scheduleUpdate)
      viewport?.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      document.removeEventListener('focusin', scheduleUpdate)
      document.removeEventListener('selectionchange', scheduleUpdate)
    })
  }, { immediate: true, flush: 'post' })

  return { drawerStyle, keyboardVisible }
}
