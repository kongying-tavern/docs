import type { Editor as TiptapEditor } from '@tiptap/core'
import type { Ref } from 'vue'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { Editor } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, onMounted, readonly, ref, watch } from 'vue'
import { EmojiNode } from '~/composables/tiptap/emojiNode'
import { createLinkExtension } from '~/composables/tiptap/linkConfig'
import { MentionNode } from '~/composables/tiptap/mentionNode'

export function useRichTextEditor(options: {
  maxTextLength?: number
  placeholder?: string
  modelValue?: Ref<string>
  replyTarget?: string
  disabled?: boolean
}) {
  const {
    maxTextLength = 2000,
    placeholder = '',
    modelValue,
    replyTarget = '',
    disabled = false,
  } = options

  const editor = ref<TiptapEditor | null>(null)
  const isReady = ref(false)

  // Character count
  const characterCount = computed(() =>
    editor.value?.storage.characterCount?.characters() ?? 0,
  )

  const characterLimit = computed(() => maxTextLength)

  const isOverLimit = computed(() =>
    characterCount.value > characterLimit.value,
  )

  // Editor content
  const editorContent = computed({
    get: () => modelValue?.value ?? '',
    set: (value) => {
      if (modelValue) {
        modelValue.value = value
      }
    },
  })

  // Initialize editor
  function initializeEditor(): void {
    editor.value = new Editor({
      extensions: [
        StarterKit.configure({
          // 禁用默认的 Link 扩展，使用自定义的 Link 扩展
          link: false,
        }),
        CharacterCount.configure({
          limit: maxTextLength,
        }),
        Placeholder.configure({
          placeholder: placeholder || '',
        }),
        EmojiNode,
        MentionNode.configure({
          HTMLAttributes: {
            class: 'mention',
          },
        }),
        createLinkExtension({ openOnClick: false, editable: true }),
      ],
      content: editorContent.value,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        const isEmpty = html === '<p></p>'
        editorContent.value = isEmpty ? '' : html
      },
      onCreate: () => {
        isReady.value = true
        insertReplyTarget()
      },
    })
  }

  // Insert reply target mention
  function insertReplyTarget(): void {
    if (!editor.value || !replyTarget)
      return

    const mention = `@${replyTarget} `
    editor.value.commands.insertContent(mention)
    editor.value.commands.focus('end')
  }

  // Editor commands
  function focusEditor(): void {
    editor.value?.commands.focus()
  }

  function clearContent(): void {
    editor.value?.commands.clearContent()
  }

  function insertContent(content: string): void {
    editor.value?.commands.insertContent(content)
  }

  function insertEmoji(emoji: string): void {
    insertContent(emoji)
    focusEditor()
  }

  function insertMention(username: string): void {
    insertContent(`@${username} `)
    focusEditor()
  }

  // Validation
  const isValid = computed(() => {
    const content = editorContent.value
    return content.length > 0 && !isOverLimit.value
  })

  const isEmpty = computed(() => {
    const content = editorContent.value
    return !content || content === '<p></p>'
  })

  // Watch for external changes
  watch(() => modelValue?.value, (newValue) => {
    if (newValue !== editor.value?.getHTML()) {
      editor.value?.commands.setContent(newValue ?? '')
    }
  })

  watch(() => disabled, (newDisabled) => {
    editor.value?.setEditable(!newDisabled)
  })

  // Lifecycle
  onMounted(() => {
    initializeEditor()
  })

  onBeforeUnmount(() => {
    editor.value?.destroy()
  })

  return {
    // State
    editor: readonly(editor),
    isReady: readonly(isReady),

    // Content
    editorContent,
    isEmpty,
    isValid,

    // Character count
    characterCount,
    characterLimit,
    isOverLimit,

    // Actions
    focusEditor,
    clearContent,
    insertContent,
    insertEmoji,
    insertMention,
  }
}
