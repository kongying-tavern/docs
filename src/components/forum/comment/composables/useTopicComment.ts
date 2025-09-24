import type ForumAPI from '@/apis/forum/api'
import type { JSONContent, Editor as TiptapEditor } from '@tiptap/core'
import type { Ref } from 'vue'
import { StarterKit } from '@tiptap/starter-kit'
import { Editor } from '@tiptap/vue-3'
import { isObject } from 'lodash-es'
import { computed, ref } from 'vue'
import { EmojiNode } from '~/composables/tiptap/emojiNode'
import { MentionNode } from '~/composables/tiptap/mentionNode'
import { useRuleChecks } from '~/composables/useRuleChecks'

export interface UseTopicCommentOptions {
  commentData: ForumAPI.Comment
  topicAuthorId: string | number
}

export function useTopicComment(options: UseTopicCommentOptions) {
  const { commentData, topicAuthorId } = options

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

  // Initialize rich text editor
  function initializeEditor(): void {
    if (editor.value || !isObject(richTextData.value)) {
      return
    }

    editor.value = new Editor({
      extensions: [StarterKit, EmojiNode, MentionNode],
      content: richTextData.value,
      editable: false,
    })
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

    // Methods
    initializeEditor,
    destroyEditor,
  }
}
