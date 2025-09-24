import type { ComputedRef } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from '~/components/forum/types'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { issues } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { executeWithAuth } from '~/composables/executeWithAuth'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { forumEvents } from '~/services/events/SimpleEventManager'

// @unocss-include
export function defineCommentDropdownMenu(
  repo: string,
  commentData?: ForumAPI.Comment,
  topicId?: string | number,
  toggleResolvedTag?: () => boolean,
): ComputedRef<FORUM.TopicDropdownMenu[]> {
  if (!commentData)
    return computed(() => [])

  const { message } = useLocalized()

  const { hasAnyPermissions } = useRuleChecks(commentData.author.id)

  const hasManagePermission = hasAnyPermissions('manage_feedback')
  const hasEditPermission = hasAnyPermissions('manage_feedback', 'edit_feedback')

  const menuLabels = ref(message.value.forum.topic.menu)

  // Check if comment is resolved
  const isResolved = computed(() => {
    // Check from tags array first
    if (commentData.tags && Array.isArray(commentData.tags)) {
      return commentData.tags.includes('已解决')
    }

    // Fallback to parsing from JSON content
    try {
      const richTextData = JSON.parse(commentData.content.text)
      return richTextData?.attrs?.resolved === true
    }
    catch {
      return false
    }
  })

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

  const needManagePermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!hasManagePermission.value || !commentData)
      return []

    return [
      {
        id: 'toggle-resolved-tag',
        type: 'item',
        label: isResolved.value ? '移除"已解决"' : '标记"已解决"',
        icon: isResolved.value ? 'i-lucide-undo-2' : 'i-lucide-check',
        action: () => {
          if (toggleResolvedTag && commentData) {
            try {
              const wasResolved = isResolved.value
              const success = toggleResolvedTag()
              if (success) {
                const action = wasResolved ? '移除' : '添加'
                toast.success(`${action}评论标签成功: 已解决`)
                forumEvents.commentUpdated(commentData.id, commentData)
              }
            }
            catch (error) {
              console.error('Error toggling resolved tag:', error)
              toast.error('操作失败，请稍后重试')
            }
          }
        },
      },
    ]
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
        id: 'delete-comment',
        label: menuLabels.value.deleteComment.text,
        icon: 'i-lucide:trash-2',
        action: handleDeleteComment,
        class: 'c-red opacity-90 hover:c-red hover:opacity-100',
      },
    ]
  })

  return computed(() => [
    ...noAnyPermissionItems.value,
    ...needManagePermissionItems.value,
    ...needEditPermissionItems.value,
  ])
}
