import type { Editor } from '@tiptap/core'
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import type { ShallowRef } from 'vue'
import type ForumAPI from '~/forum/api/types'
import type { ForumEditorSuggestionItem } from '~/forum/tiptap/forumSuggestionRenderer'
import { exitSuggestion } from '@tiptap/suggestion'
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { mentionPluginKey } from '~/forum/tiptap/mentionNode'

const WHITESPACE = /\s/

/** Use the existing suggestion range/command for both typed and toolbar mentions. */
export function useMobileEditorMention(editor: ShallowRef<Editor | null>, getUsers: () => readonly ForumAPI.User[], onSelect: (user: ForumAPI.User) => void, isMobile: () => boolean) {
  const current = shallowRef<SuggestionProps<ForumEditorSuggestionItem>>()
  const keepOpen = ref(false)
  const selectedUserIds = ref<string[]>([])
  let selecting = false
  const active = computed(() => !!current.value || keepOpen.value)
  watch([editor, isMobile], ([ed, mobile], _, onCleanup) => {
    if (!ed || !mobile)
      return
    function readSelectedUsers(): void {
      const ids = new Set<string>()
      ed!.state.doc.descendants((node) => {
        if (node.type.name === 'mention')
          ids.add(String(node.attrs.id))
      })
      selectedUserIds.value = [...ids]
    }
    function onUpdate(): void {
      readSelectedUsers()
      if (!selecting)
        keepOpen.value = false
    }
    readSelectedUsers()
    ed.on('update', onUpdate)
    onCleanup(() => ed.off('update', onUpdate))
  }, { immediate: true })
  const query = computed(() => current.value?.query ?? '')
  const showHint = computed(() => {
    if (!current.value || current.value.query || !editor.value)
      return false
    const position = editor.value.state.doc.resolve(current.value.range.to)
    return position.parentOffset === position.parent.content.size
  })
  const hintStyle = ref<{ left: string, top: string }>()
  const selectedIndex = ref(0)
  const items = computed(() => getUsers().filter(user => `${user.username} ${user.login}`.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())).slice(0, 8))

  function positionHint(): void {
    if (!current.value || !editor.value)
      return
    const rect = editor.value.view.coordsAtPos(current.value.range.to)
    const host = editor.value.view.dom.parentElement?.getBoundingClientRect()
    if (!host)
      return
    const left = rect.left - host.left + 4
    const wrap = host.width - left < Math.min(160, host.width)
    const lineHeight = Number.parseFloat(getComputedStyle(editor.value.view.dom).lineHeight) || rect.bottom - rect.top
    hintStyle.value = {
      left: `${wrap ? 0 : left}px`,
      top: `${rect.top - host.top + (wrap ? lineHeight : 0)}px`,
    }
  }
  useResizeObserver(computed(() => editor.value?.view.dom.parentElement), positionHint)
  function update(props: SuggestionProps<ForumEditorSuggestionItem>): void {
    keepOpen.value = false
    current.value = props
    selectedIndex.value = 0
    void nextTick(positionHint)
  }
  function begin(): void {
    const ed = editor.value
    if (!ed)
      return
    if (current.value) {
      ed.commands.setTextSelection(current.value.range.to)
      ed.view.dom.focus({ preventScroll: true })
      return
    }
    const { from } = ed.state.selection
    const before = ed.state.doc.textBetween(Math.max(0, from - 1), from)
    ed.chain().insertContent(before && !WHITESPACE.test(before) ? ' @' : '@').run()
    ed.view.dom.focus({ preventScroll: true })
  }
  async function select(user: ForumAPI.User): Promise<void> {
    if (selecting)
      return
    if (selectedUserIds.value.includes(String(user.id))) {
      editor.value?.view.dom.focus({ preventScroll: true })
      return
    }
    selecting = true
    try {
      // Each additional choice uses the same suggestion command and range.
      if (!current.value) {
        begin()
        // Suggestion publishes the new command after resolving its items.
        await nextTick()
      }
      if (!current.value)
        return
      current.value.command({ id: user.id, label: user.login })
      keepOpen.value = true
      onSelect(user)
      editor.value?.view.dom.focus({ preventScroll: true })
    }
    finally {
      selecting = false
    }
  }
  function close(): void {
    keepOpen.value = false
    if (editor.value)
      exitSuggestion(editor.value.view, mentionPluginKey)
    current.value = undefined
  }
  const render: SuggestionOptions<ForumEditorSuggestionItem>['render'] = () => ({
    onStart: update,
    onUpdate: update,
    onExit: () => current.value = undefined,
    onKeyDown: ({ event }) => {
      if (event.isComposing)
        return false
      if (event.key === 'Escape') {
        close()
        return true
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        selectedIndex.value = Math.max(0, Math.min(items.value.length - 1, selectedIndex.value + (event.key === 'ArrowDown' ? 1 : -1)))
        return true
      }
      const user = items.value[selectedIndex.value]
      if (event.key === 'Enter' && user) {
        select(user)
        return true
      }
      return false
    },
  })
  return { active, query, showHint, items, selectedIndex, selectedUserIds, hintStyle, render, begin, select, close }
}
