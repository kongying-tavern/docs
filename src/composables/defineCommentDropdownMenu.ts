import type ForumAPI from '@/apis/forum/api'
import type { ComputedRef } from 'vue'
import type { FORUM } from '~/components/forum/types'
import { useLocalized } from '@/hooks/useLocalized'
import { useClipboard } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTopicComments } from '~/composables/useTopicComment'

// @unocss-include
export function defineCommentDropdownMenu(repo: string, commentData?: ForumAPI.Comment): ComputedRef<FORUM.TopicDropdownMenu[]> {
  if (!commentData)
    return computed(() => [])

  const { deleteComment } = useTopicComments()
  const { message } = useLocalized()

  const { copy, copied, isSupported: isCopySupported } = useClipboard()
  const { hasAnyPermissions } = useRuleChecks(commentData.author.id)

  const hasEditPermission = hasAnyPermissions('manage_feedback', 'edit_feedback')

  const menuLabels = ref(message.value.forum.topic.menu)

  async function handleDeleteComment() {
    if (commentData)
      await deleteComment(repo, commentData.id)
  }

  const noAnyPermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    return [
      isCopySupported.value
        ? {
            type: 'item',
            id: 'copy-link',
            label: copied.value ? menuLabels.value.copyLink.success : '复制评论',
            icon: 'i-lucide:clipboard',
            action: async () => {
              await copy(commentData.content.text)
            },
          }
        : null,
    ].filter(Boolean) as FORUM.TopicDropdownMenu[]
  })

  const needEditPermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!hasEditPermission.value)
      return []

    return [
      {
        type: 'separator',
      },
      {
        type: 'item',
        id: 'close-feedback',
        label: menuLabels.value.deleteComment.text,
        icon: 'i-lucide:trash-2',
        action: handleDeleteComment,
        class: 'c-red opacity-90 hover:c-red hover:opacity-100',
      },
    ]
  })

  return computed(() => [
    ...noAnyPermissionItems.value,
    ...needEditPermissionItems.value,
  ])
}
