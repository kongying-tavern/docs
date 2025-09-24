import type { JSONContent, Editor as TiptapEditor } from '@tiptap/core'
import type { Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import StarterKit from '@tiptap/starter-kit'
import { Editor } from '@tiptap/vue-3'
import { isObject } from 'lodash-es'
import { computed, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { EmojiNode } from '~/composables/tiptap/emojiNode'
import { createLinkExtension } from '~/composables/tiptap/linkConfig'
import { MentionNode } from '~/composables/tiptap/mentionNode'
import { ResolvedTagExtension } from '~/composables/tiptap/tagsExtension'
import { useRuleChecks } from '~/composables/useRuleChecks'

export interface UseTopicCommentOptions {
  commentData: ForumAPI.Comment
  topicAuthorId: string | number
}

export function useTopicComment(options: UseTopicCommentOptions) {
  const { commentData, topicAuthorId } = options
  const { message } = useLocalized()

  // Rich text editor state
  const editor = ref<TiptapEditor | null>(null)
  const richTextData = ref<null | JSONContent>(null)

  // Parse rich text data (compatible with legacy plain text comments)
  try {
    richTextData.value = JSON.parse(commentData.content.text)
  }
  catch {
    // Keep as null for plain text comments
  }

  // Resolved state
  const isResolved = ref<boolean>(false)

  // Extract initial resolved state from content
  if (richTextData.value?.attrs?.resolved === true) {
    isResolved.value = true
  }

  // Rule checks composable
  const { isOfficial } = useRuleChecks()

  // Computed role based on author
  const role = computed(() => {
    if (topicAuthorId === commentData.author.id) {
      return 'author'
    }
    if (isOfficial(commentData.author.id).value) {
      return 'official'
    }
    return null
  })

  // Handle resolved state updates from editor
  function handleResolvedToggle(resolved: boolean): void {
    isResolved.value = resolved

    // Update comment data - create tags array with resolved status
    if (commentData.tags !== undefined) {
      commentData.tags = resolved ? [message.value.forum.labels.resolved] : []
    }

    // Update the JSON content text
    if (editor.value) {
      const content = editor.value.getJSON()
      commentData.content.text = JSON.stringify(content)
    }
  }

  // Initialize rich text editor
  function initializeEditor(): void {
    if (editor.value || !isObject(richTextData.value)) {
      return
    }

    editor.value = new Editor({
      extensions: [
        StarterKit.configure({
          // 禁用默认的 Link 扩展，使用自定义的 Link 扩展
          link: false,
        }),
        EmojiNode,
        MentionNode,
        createLinkExtension({ openOnClick: true, editable: false }),
        ResolvedTagExtension.configure({
          onToggle: handleResolvedToggle,
        }),
      ],
      content: richTextData.value,
      editable: false,
    })

    // Set initial resolved state in the editor
    if (isResolved.value) {
      editor.value.commands.setResolvedTag(true)
    }
  }

  // Toggle resolved tag function for external use
  function toggleResolvedTag(): boolean {
    if (editor.value) {
      return editor.value.commands.toggleResolvedTag()
    }
    return false
  }

  // Set resolved state function for external use
  function setResolvedTag(resolved: boolean): boolean {
    if (editor.value) {
      return editor.value.commands.setResolvedTag(resolved)
    }
    return false
  }

  // Cleanup editor
  function destroyEditor(): void {
    if (editor.value) {
      editor.value.destroy()
      editor.value = null
    }
  }

  return {
    // State
    editor: editor as Ref<TiptapEditor | null>,
    richTextData,
    role,
    isResolved,

    // Methods
    initializeEditor,
    destroyEditor,
    toggleResolvedTag,
    setResolvedTag,
  }
}
