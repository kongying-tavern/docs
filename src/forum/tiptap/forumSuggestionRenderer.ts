import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import type ForumAPI from '@/apis/forum/api'
import { VueRenderer } from '@tiptap/vue-3'
import ForumEditorSuggestionList from '~/components/forum/form/ForumEditorSuggestionList.vue'

interface ForumEditorSuggestionItemBase {
  id: string | number
  label: string
  description?: string
}

export type ForumEditorSuggestionItem
  = | ForumEditorSuggestionItemBase & { kind: 'user', avatar?: string }
    | ForumEditorSuggestionItemBase & { kind: 'topic', topicType: ForumAPI.TopicType }

export function createForumSuggestionRenderer() {
  return () => {
    let component: VueRenderer | undefined
    let current: SuggestionProps<ForumEditorSuggestionItem> | undefined

    function position(): void {
      const rect = current?.clientRect?.()
      const element = component?.element as HTMLElement | undefined
      if (!element || !rect)
        return
      const host = element.parentElement
      const hostRect = host?.getBoundingClientRect()
      const viewportLeft = Math.max(12, Math.min(rect.left, window.innerWidth - element.offsetWidth - 12))
      const viewportTop = Math.max(12, Math.min(rect.bottom + 6, window.innerHeight - element.offsetHeight - 12))
      element.style.pointerEvents = 'auto'
      element.style.zIndex = '10000'
      element.style.position = host === document.body ? 'fixed' : 'absolute'
      element.style.left = `${hostRect ? viewportLeft - hostRect.left + (host?.scrollLeft ?? 0) : viewportLeft}px`
      element.style.top = `${hostRect ? viewportTop - hostRect.top + (host?.scrollTop ?? 0) : viewportTop}px`
    }

    return {
      onStart(props: SuggestionProps<ForumEditorSuggestionItem>) {
        current = props
        component = new VueRenderer(ForumEditorSuggestionList, {
          props,
          editor: props.editor,
        })
        const editorElement = props.editor.view.dom as HTMLElement
        const host = editorElement.closest<HTMLElement>('[role="dialog"], [data-slot="drawer-content"]') ?? document.body
        if (component.element) {
          host.append(component.element)
          requestAnimationFrame(position)
        }
        position()
      },
      onUpdate(props: SuggestionProps<ForumEditorSuggestionItem>) {
        current = props
        component?.updateProps(props)
        position()
      },
      onKeyDown(props: SuggestionKeyDownProps) {
        return Boolean((component?.ref as { onKeyDown?: (props: SuggestionKeyDownProps) => boolean } | undefined)?.onKeyDown?.(props))
      },
      onExit() {
        component?.element?.remove()
        component?.destroy()
        component = undefined
        current = undefined
      },
    }
  }
}
