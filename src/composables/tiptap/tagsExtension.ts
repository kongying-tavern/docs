import type { Editor } from '@tiptap/core'
import { Extension } from '@tiptap/core'

export interface ResolvedTagOptions {
  onToggle?: (isResolved: boolean) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resolvedTag: {
      toggleResolvedTag: () => ReturnType
      setResolvedTag: (resolved: boolean) => ReturnType
      getResolvedStatus: () => ReturnType
    }
  }
}

export const ResolvedTagExtension = Extension.create<ResolvedTagOptions>({
  name: 'resolvedTag',

  addOptions() {
    return {
      onToggle: undefined,
    }
  },

  addStorage() {
    return {
      resolved: false,
    }
  },

  addCommands() {
    return {
      toggleResolvedTag:
        () =>
          ({ commands: _commands, editor: _editor }) => {
            this.storage.resolved = !this.storage.resolved
            this.options.onToggle?.(this.storage.resolved)
            return true
          },

      setResolvedTag:
        (resolved: boolean) =>
          ({ commands: _commands, editor: _editor }) => {
            this.storage.resolved = resolved
            this.options.onToggle?.(this.storage.resolved)
            return true
          },

      getResolvedStatus:
        () =>
          ({ editor: _editor }: { editor: Editor }) => {
            return this.storage.resolved
          },
    }
  },

  onCreate() {
    // Initialize from content if available
    const content = this.editor.getJSON()
    if (content.attrs?.resolved === true) {
      this.storage.resolved = true
    }
  },

  onUpdate() {
    // Keep content in sync
    const content = this.editor.getJSON()
    if (!content.attrs) {
      content.attrs = {}
    }
    content.attrs.resolved = this.storage.resolved
  },
})
