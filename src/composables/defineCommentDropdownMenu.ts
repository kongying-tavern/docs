import type ForumAPI from '@/apis/forum/api'
import type { ComputedRef } from 'vue'
import type { FORUM } from '~/components/forum/types'
import { issues } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { computed, ref } from 'vue'
import { executeWithAuth } from '~/composables/executeWithAuth'
import { useRuleChecks } from '~/composables/useRuleChecks'

import { forumEvents } from '~/services/events/SimpleEventManager'

// @unocss-include
export function defineCommentDropdownMenu(
  repo: string,
  commentData?: ForumAPI.Comment,
  topicId?: string | number,
): ComputedRef<FORUM.TopicDropdownMenu[]> {
  if (!commentData)
    return computed(() => [])

  const { message } = useLocalized()

  const { hasAnyPermissions } = useRuleChecks(commentData.author.id)

  const hasEditPermission = hasAnyPermissions('manage_feedback', 'edit_feedback')

  const menuLabels = ref(message.value.forum.topic.menu)

  async function handleDeleteComment() {
    if (!commentData)
      return

    const result = await executeWithAuth(
      issues.deleteTopicComment,
      [commentData.id, repo],
      message.value.forum.topic.menu.deleteComment.success,
      message.value.forum.topic.menu.deleteComment.fail,
      message,
    )

    // Emit event if deletion was successful
    if (result) {
      forumEvents.commentDeleted(commentData.id, topicId || 'unknown')
    }
  }

  const noAnyPermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    return [].filter(Boolean) as FORUM.TopicDropdownMenu[]
  })

  const needEditPermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!hasEditPermission.value)
      return []

    return [
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
