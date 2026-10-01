import type { Editor } from '@tiptap/core'
import type { ForumInputShortcutId } from '~/forum/services/forumShortcuts'
import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { useForumShortcutPreferences } from '~/forum/composables/state/useForumShortcutPreferences'
import { resolveEditorShortcut } from '~/forum/services/forumShortcuts'

/** High-priority editor keymap masks old formatting bindings when remapped or disabled. */
export function useForumEditorShortcuts(options: { send?: () => boolean, enabled?: () => boolean } = {}) {
  const preferences = useForumShortcutPreferences()
  function run(id: ForumInputShortcutId, editor: Editor): boolean {
    if (id === 'send')
      return options.send?.() ?? false
    return editor.chain().focus()[id === 'bold' ? 'toggleBold' : id === 'italic' ? 'toggleItalic' : 'toggleStrike']().run()
  }
  return Extension.create({
    name: 'forumShortcuts',
    priority: 1000,
    addProseMirrorPlugins() {
      const editor = this.editor
      return [new Plugin({
        props: {
          handleKeyDown: (_view, event) => {
            if (!preferences.desktopUi.value || event.isComposing || event.getModifierState('AltGraph'))
              return false
            const action = resolveEditorShortcut(preferences.preferences.value, event, !!options.send)
            if (!action)
              return false
            if (action.enabled && !event.repeat && !preferences.recording.value && editor.isEditable && (options.enabled?.() ?? true))
              run(action.id, editor)
            return true
          },
        },
      })]
    },
  })
}
