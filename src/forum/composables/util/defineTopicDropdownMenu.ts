import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type ForumAPI from '~/forum/api/types'
import type { FORUM } from '~/forum/components/types'
import type { CustomConfig } from '~/forum/types'
import { computed, toValue } from 'vue'
import { issues } from '~/forum/api/gitee'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumPersonalState } from '~/forum/composables/data/useForumPersonalState'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useTopicManager } from '~/forum/composables/state/useTopicManager'
import { useTopicStatusEditor } from '~/forum/composables/state/useTopicStatusEditor'
import { createTopicStatusGroupItems, useTopicStatusMenu } from '~/forum/composables/state/useTopicStatusMenu'
import { useTopicTypeMenu } from '~/forum/composables/state/useTopicTypeMenu'
import { useTopicOperationFeedback } from '~/forum/composables/view/useTopicOperationFeedback'
import { getSelectableTopicStatuses } from '~/forum/services/forumTopicStatus'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { toast } from '~/services/telemetry/toast'
import { useReactionStats } from '../data/useReactionStats'
import { useTopicReactionState } from '../data/useTopicsReaction'
import { useTopicTagsEditor } from '../state/useTopicTagsEditor'

// @unocss-include
export function defineTopicDropdownMenu(topicData: MaybeRefOrGetter<ForumAPI.Topic>, message: Ref<CustomConfig>): ComputedRef<FORUM.TopicDropdownMenu[]> {
  const currentTopic = computed(() => toValue(topicData))
  const {
    toggleCloseTopic,
    toggleGoodIssue,
    toggleHideTopic,
    togglePinnedTopic,
    toggleTopicCommentArea,
    hideTopicWithStatus,
    updatingTopic,
  } = useTopicManager(currentTopic, message, useTopicOperationFeedback())
  const { route, leaveTopic } = useForumRoute()
  const { hasAnyPermissions } = useRuleChecks(() => currentTopic.value.user.id)
  const personal = useForumPersonalState()
  const auth = useUserAuthStore()
  const isLoggedIn = computed(() => auth.isTokenValid)

  const [closeState, toggleClose] = toggleCloseTopic()
  const [hideState, toggleHide] = toggleHideTopic()

  const { openTopicTagsEditorDialog } = useTopicTagsEditor()
  const { openCloseTopicDialog } = useTopicStatusEditor()
  const { openReactionStatsDialog } = useReactionStats()
  const reactionQueryFailed = useTopicReactionState(() => currentTopic.value.id).error

  const menuLabels = computed(() => message.value.forum.topic.menu)

  const hasManagePermission = hasAnyPermissions('manage_feedback')
  const { items: statusSubmenuItems, canEdit: hasEditPermission } = useTopicStatusMenu(currentTopic, message)
  const { items: topicTypeItems } = useTopicTypeMenu(currentTopic, message)

  const openOnGitee = () => issues.openTopicOnGitee(currentTopic.value.id)

  async function handleToggleCloseTopic() {
    if (!closeState.value) {
      openCloseTopicDialog(currentTopic.value)
      return
    }
    const result = await toggleClose()
    if (result && result.state === 'closed' && route.value?.name === 'topic' && route.value.topicId === String(result.id))
      await leaveTopic()
  }

  async function handleToggleHideTopic() {
    const result = await toggleHide()
    if (result && result.state === 'progressing' && route.value?.name === 'topic' && route.value.topicId === String(result.id))
      await leaveTopic()
  }

  /**
   * 无状态话题的「隐藏反馈」不出直接隐藏项：隐藏后列表里只剩一个没有原因的「已结」，
   * 因此要求先挑一个状态，选中后状态与隐藏在同一次请求里落库。
   */
  const hideFeedbackSubmenuItems = computed<FORUM.MenuElement[]>(() =>
    createTopicStatusGroupItems(
      getSelectableTopicStatuses(currentTopic.value.type),
      'hide-topic-status',
      message.value,
      updatingTopic.value,
      status => () => handleHideTopicWithStatus(status),
    ))

  /** 隐藏子菜单的选择：隐藏必然使话题离开列表，此时留在详情页没有意义，与直接隐藏一致地退回上一页。 */
  async function handleHideTopicWithStatus(status: ForumAPI.TopicStatus) {
    const topicId = String(currentTopic.value.id)
    const result = await hideTopicWithStatus(status)
    if (result && route.value?.name === 'topic' && route.value.topicId === topicId)
      await leaveTopic()
  }

  async function handleToggleFollow() {
    const wasFollowing = personal.isFollowing(currentTopic.value.id)
    try {
      await personal.toggleFollow(currentTopic.value)
      if (personal.isFollowing(currentTopic.value.id) === wasFollowing)
        toast.error(message.value.forum.errors.followFailed, { scene: 'op' })
    }
    catch (error) {
      toast.error(message.value.forum.errors.followFailed, { error, scene: 'op' })
    }
  }

  const noAnyPermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    const items: FORUM.TopicDropdownMenu[] = [
      {
        type: 'item',
        id: 'gitee-link',
        order: 1,
        label: menuLabels.value.giteeLink,
        icon: 'i-lucide:cable',
        action: openOnGitee,
      },
    ]

    if (!isLoggedIn.value)
      return items

    const following = personal.isFollowing(currentTopic.value.id)

    return [
      ...items,
      {
        type: 'item',
        id: 'follow-topic',
        order: 3,
        label: following
          ? message.value.forum.labels.unfollow
          : message.value.forum.labels.follow,
        icon: following ? 'i-lucide:bookmark-minus' : 'i-lucide:bookmark',
        disabled: personal.saving.value,
        action: handleToggleFollow,
      },
    ]
  })

  const needManagePermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!hasManagePermission.value)
      return []

    return [
      {
        type: 'separator',
      },
      ...(!reactionQueryFailed.value
        ? [{
            id: 'reaction-stats',
            type: 'item',
            label: menuLabels.value.reactionStats.text,
            icon: 'i-lucide:chart-column',
            action: () => openReactionStatsDialog({ kind: 'topic', topicId: String(currentTopic.value.id) }),
          } as const]
        : []),
      {
        type: 'submenu',
        id: 'change-type-topic',
        label: menuLabels.value.changeType.text,
        icon: 'i-lucide:settings',
        items: topicTypeItems.value,
      },
      {
        id: 'tags-topic',
        type: 'item',
        label: menuLabels.value.modifyTags.text,
        icon: 'i-lucide-tags',
        action: () => openTopicTagsEditorDialog(currentTopic.value),
      },
      {
        id: 'pinned-topic',
        type: 'item',
        label: currentTopic.value.pinned ? menuLabels.value.pinTopic.unpin : menuLabels.value.pinTopic.pin,
        icon: currentTopic.value.pinned ? 'i-lucide:pin-off' : 'i-lucide:pin',
        action: togglePinnedTopic,
      },
      {
        id: 'close-comment-topic',
        type: 'item',
        label: currentTopic.value.commentCount === -1 ? menuLabels.value.commentArea.open : menuLabels.value.commentArea.close,
        icon: currentTopic.value.commentCount === -1 ? 'i-lucide:message-circle' : 'i-lucide:message-circle-off',
        action: toggleTopicCommentArea,
      },
      // 已隐藏给「取消隐藏」，有状态时「隐藏反馈」直接执行；无状态则先经二级菜单
      // 挑一个状态再隐藏（见 hideFeedbackSubmenuItems）。hideState 是 ref，
      // 漏掉 .value 会永远为真（且照样过类型检查）
      hideState.value
        ? {
            id: 'hide-topic',
            type: 'item',
            label: menuLabels.value.unhideFeedback.text,
            icon: 'i-lucide:eye',
            action: handleToggleHideTopic,
          }
        : currentTopic.value.status
          ? {
              id: 'hide-topic',
              type: 'item',
              label: menuLabels.value.hideFeedback.text,
              icon: 'i-lucide:eye-off',
              action: handleToggleHideTopic,
            }
          : {
              id: 'hide-topic',
              type: 'submenu',
              label: menuLabels.value.hideFeedback.text,
              icon: 'i-lucide:eye-off',
              items: hideFeedbackSubmenuItems.value,
            },
    ]
  })

  const needEditStatusItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!hasEditPermission.value)
      return []

    return [
      {
        type: 'separator',
      },
      {
        type: 'submenu',
        id: 'status-topic',
        label: menuLabels.value.modifyStatus.text,
        icon: 'i-lucide:circle-dot-dashed',
        items: statusSubmenuItems.value,
      },
      {
        type: 'item',
        id: 'good-issue-topic',
        label: currentTopic.value.goodIssue
          ? menuLabels.value.goodIssue.unmark
          : menuLabels.value.goodIssue.mark,
        icon: currentTopic.value.goodIssue ? 'i-lucide:badge-minus' : 'i-lucide:badge-check',
        action: toggleGoodIssue,
      },
    ]
  })

  const closeTopicItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!hasEditPermission.value)
      return []

    return [
      {
        type: 'separator',
      },
      {
        type: 'item',
        id: 'close-feedback',
        label: closeState.value ? menuLabels.value.reopenFeedback.text : menuLabels.value.closeFeedback.text,
        icon: closeState.value ? 'i-lucide:archive-restore' : 'i-lucide:archive',
        action: handleToggleCloseTopic,
        variant: closeState.value ? undefined : 'destructive',
      },
    ]
  })

  return computed(() => [
    ...noAnyPermissionItems.value,
    ...needEditStatusItems.value,
    ...needManagePermissionItems.value,
    ...closeTopicItems.value,
  ])
}
