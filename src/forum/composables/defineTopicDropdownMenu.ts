import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from '~/components/forum/types'
import type { TopicStatusDefinition } from '~/forum/services/forumTopicStatus'
import type { CustomConfig } from '~/types/locales'
import { computed, ref, toValue } from 'vue'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { issues } from '~/forum/api/gitee'
import { useForumPersonalState } from '~/forum/composables/useForumPersonalState'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import { useRuleChecks } from '~/forum/composables/useRuleChecks'
import { useTopicManager } from '~/forum/composables/useTopicManager'
import { useTopicStatusEditor } from '~/forum/composables/useTopicStatusEditor'
import {
  getSelectableTopicStatuses,
  groupTopicStatuses,
  TOPIC_STATUS_LABEL,
} from '~/forum/services/forumTopicStatus'
import { toast } from '~/services/telemetry/toast'
import { useReactionStats } from './useReactionStats'
import { useTopicReactionState } from './useTopicsReaction'
import { useTopicTagsEditor } from './useTopicTagsEditor'

// @unocss-include
export function defineTopicDropdownMenu(topicData: MaybeRefOrGetter<ForumAPI.Topic>, message: Ref<CustomConfig>): ComputedRef<FORUM.TopicDropdownMenu[]> {
  const currentTopic = computed(() => toValue(topicData))
  const {
    toggleCloseTopic,
    toggleGoodIssue,
    toggleHideTopic,
    togglePinnedTopic,
    toggleTopicType,
    toggleTopicCommentArea,
    setTopicStatus,
    hideTopicWithStatus,
    updatingTopic,
  } = useTopicManager(currentTopic, message)
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

  const menuLabels = ref(message.value.forum.topic.menu)

  const hasManagePermission = hasAnyPermissions('manage_feedback')
  const hasEditPermission = hasAnyPermissions('edit_feedback')
  const topicTypeEnum: ForumAPI.FeedbackTopicType[] = ['FEAT', 'BUG', 'ANN']

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
   * 结论状态会把话题移出列表，此时留在详情页没有意义 —— 与隐藏/归档一致地退回上一页。
   * 只看「未结 → 非未结」的跨越，避免在已隐藏话题上反复跳转。
   */
  async function handleSetTopicStatus(status: ForumAPI.TopicStatus | null) {
    const topicId = String(currentTopic.value.id)
    const wasOpen = currentTopic.value.state === 'open'
    const result = await setTopicStatus(status)
    if (!result)
      return
    if (wasOpen && result.state !== 'open' && route.value?.name === 'topic' && route.value.topicId === topicId)
      await leaveTopic()
  }

  /** 把一组状态定义铺成分组菜单条目；idPrefix 用于区分同一状态在不同子菜单里的条目。 */
  function buildStatusGroupItems(
    definitions: readonly TopicStatusDefinition[],
    idPrefix: string,
    createAction: (status: ForumAPI.TopicStatus) => () => unknown,
  ): FORUM.MenuElement[] {
    const items: FORUM.MenuElement[] = []
    for (const { group, definitions: grouped } of groupTopicStatuses(definitions)) {
      items.push({ type: 'separator' })
      items.push({
        type: 'group',
        items: [
          {
            type: 'label',
            label: message.value.forum.topic.statusGroups[group],
            // 结论状态会把未结反馈带走，「已结」这件事不写出来用户看不出来
            hint: grouped.some(definition => definition.hidesTopic)
              ? menuLabels.value.modifyStatus.conclusiveHint
              : undefined,
          },
          ...grouped.map(definition => ({
            id: `${idPrefix}-${definition.id}`,
            type: 'item' as const,
            label: message.value.forum.topic.status[definition.id],
            status: definition.id,
            disabled: updatingTopic.value,
            action: createAction(definition.id),
          })),
        ],
      })
    }
    return items
  }

  /**
   * 无状态话题的「隐藏反馈」不出直接隐藏项：隐藏后列表里只剩一个没有原因的「已结」，
   * 因此要求先挑一个状态，选中后状态与隐藏在同一次请求里落库。
   */
  const hideFeedbackSubmenuItems = computed<FORUM.MenuElement[]>(() =>
    buildStatusGroupItems(
      getSelectableTopicStatuses(currentTopic.value.type),
      'hide-topic-status',
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
        items: topicTypeEnum.filter(val => val !== currentTopic.value.type).map(
          val => ({
            id: `change-topic-${val}`,
            type: 'item',
            label: `${menuLabels.value.changeType.to} ${message.value.forum.topic.type[val.toLowerCase() as keyof typeof message.value.forum.topic.type] || val}`,
            disabled: updatingTopic.value,
            action: () => toggleTopicType(val),
          }),
        ),
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

  const hasStatusConflict = computed(() => (currentTopic.value.labels ?? []).filter(label => TOPIC_STATUS_LABEL.test(label)).length > 1)

  /**
   * 状态直接选、不再经过弹窗。候选里不含话题当前状态 —— 它已经在话题上，
   * 再选一次没有意义；要脱离当前状态就走「清除状态」，因此该行只在有状态时出现。
   */
  const statusSubmenuItems = computed<FORUM.MenuElement[]>(() => {
    const currentStatus = currentTopic.value.status
    const items: FORUM.MenuElement[] = []

    if (currentStatus) {
      items.push({
        id: 'status-topic-none',
        type: 'item',
        label: menuLabels.value.modifyStatus.none,
        status: null,
        disabled: updatingTopic.value,
        action: () => handleSetTopicStatus(null),
      })
    }

    if (hasStatusConflict.value) {
      items.push({
        id: 'status-topic-conflict',
        type: 'info',
        label: menuLabels.value.modifyStatus.conflict,
        class: 'important:c-[var(--vp-c-warning-1)] max-w-56',
      })
    }

    items.push(...buildStatusGroupItems(
      getSelectableTopicStatuses(currentTopic.value.type, currentStatus),
      'status-topic',
      status => () => handleSetTopicStatus(status),
    ))

    return items
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
        class: closeState.value ? undefined : 'c-red opacity-90 hover:c-red hover:opacity-100',
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
