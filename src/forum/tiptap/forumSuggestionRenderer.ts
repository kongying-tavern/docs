import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import type ForumAPI from '~/forum/api/types'
import { VueRenderer } from '@tiptap/vue-3'
import { nextTick } from 'vue'
import ForumEditorSuggestionList from '~/forum/components/form/ForumEditorSuggestionList.vue'

interface ForumEditorSuggestionItemBase {
  id: string | number
  label: string
  description?: string
}

export type ForumEditorSuggestionItem
  = | ForumEditorSuggestionItemBase & { kind: 'user', avatar?: string }
    | ForumEditorSuggestionItemBase & { kind: 'topic', topicType?: ForumAPI.TopicType, manual?: boolean }

export function createForumSuggestionRenderer() {
  return () => {
    let component: VueRenderer | undefined
    let current: SuggestionProps<ForumEditorSuggestionItem> | undefined
    let frame = 0
    let dismissed = false

    function hideOnBlur(): void {
      if (component?.element)
        (component.element as HTMLElement).style.display = 'none'
    }

    function showOnFocus(): void {
      if (component?.element && !dismissed) {
        (component.element as HTMLElement).style.display = ''
        schedulePosition()
      }
    }

    function schedulePosition(): void {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(position)
    }

    function position(): void {
      const rect = current?.clientRect?.()
      const element = component?.element as HTMLElement | undefined
      if (!element || !rect || dismissed)
        return
      const host = element.parentElement
      const hostRect = host === document.body ? undefined : host?.getBoundingClientRect()
      const viewportLeft = Math.max(12, Math.min(rect.left, window.innerWidth - element.offsetWidth - 12))
      const below = rect.bottom + 6
      const above = rect.top - element.offsetHeight - 6
      const viewportTop = Math.max(12, Math.min(
        below + element.offsetHeight > window.innerHeight - 12 && above >= 12 ? above : below,
        window.innerHeight - element.offsetHeight - 12,
      ))
      element.style.pointerEvents = 'auto'
      element.style.zIndex = '10000'
      element.style.position = host === document.body ? 'fixed' : 'absolute'
      element.style.left = `${hostRect ? viewportLeft - hostRect.left + (host?.scrollLeft ?? 0) : viewportLeft}px`
      element.style.top = `${hostRect ? viewportTop - hostRect.top + (host?.scrollTop ?? 0) : viewportTop}px`
    }

    return {
      onStart(props: SuggestionProps<ForumEditorSuggestionItem>) {
        dismissed = false
        current = props
        component = new VueRenderer(ForumEditorSuggestionList, {
          props,
          editor: props.editor,
        })
        const editorElement = props.editor.view.dom as HTMLElement
        const host = editorElement.closest<HTMLElement>('[role="dialog"], [data-slot="drawer-content"]') ?? document.body
        if (component.element) {
          host.append(component.element)
          schedulePosition()
        }
        window.addEventListener('scroll', schedulePosition, true)
        window.addEventListener('resize', schedulePosition)
        props.editor.on('blur', hideOnBlur)
        props.editor.on('focus', showOnFocus)
        position()
      },
      onUpdate(props: SuggestionProps<ForumEditorSuggestionItem>) {
        current = props
        component?.updateProps(props)
        void nextTick(schedulePosition)
      },
      onKeyDown(props: SuggestionKeyDownProps) {
        if (dismissed)
          return false
        if (props.event.key === 'Escape' && !props.event.isComposing) {
          dismissed = true
          if (component?.element)
            (component.element as HTMLElement).style.display = 'none'
          return true
        }
        return Boolean((component?.ref as { onKeyDown?: (props: SuggestionKeyDownProps) => boolean } | undefined)?.onKeyDown?.(props))
      },
      onExit() {
        cancelAnimationFrame(frame)
        window.removeEventListener('scroll', schedulePosition, true)
        window.removeEventListener('resize', schedulePosition)
        current?.editor.off('blur', hideOnBlur)
        current?.editor.off('focus', showOnFocus)
        component?.element?.remove()
        component?.destroy()
        component = undefined
        current = undefined
      },
    }
  }
}
