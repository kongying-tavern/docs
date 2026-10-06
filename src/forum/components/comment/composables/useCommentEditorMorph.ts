import type { Ref } from 'vue'
import { ref } from 'vue'

/** Measure both surfaces without scaling the editor's text or controls. */
export function useCommentEditorMorph(root: Readonly<Ref<HTMLElement | null>>, getOrigin: () => HTMLElement | undefined) {
  const style = ref<Record<string, string>>({})

  function prepare(): boolean {
    const surface = root.value?.closest<HTMLElement>('[data-slot="dialog-content"]')
    const origin = getOrigin()
    if (!surface || !origin)
      return false
    const entry = origin.getBoundingClientRect()
    const panel = surface.getBoundingClientRect()
    if (!entry.width || !entry.height)
      return false
    style.value = {
      '--comment-entry-left': `${entry.left}px`,
      '--comment-entry-top': `${entry.top}px`,
      '--comment-entry-width': `${entry.width}px`,
      '--comment-entry-height': `${entry.height}px`,
      '--comment-entry-radius': getComputedStyle(origin).borderRadius,
      '--comment-panel-left': `${panel.left}px`,
      '--comment-panel-width': `${panel.width}px`,
      '--comment-panel-radius': getComputedStyle(surface).borderRadius,
      '--comment-panel-top': `${panel.top}px`,
      '--comment-panel-height': `${panel.height}px`,
    }
    return true
  }

  return { style, prepare }
}
