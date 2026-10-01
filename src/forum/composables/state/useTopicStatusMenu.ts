import type { MaybeRefOrGetter, Ref } from 'vue'
import type ForumAPI from '~/forum/api/types'
import type { FORUM } from '~/forum/components/types'
import type { TopicStatusDefinition } from '~/forum/services/forumTopicStatus'
import type { CustomConfig } from '~/forum/types'
import { computed, toValue } from 'vue'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useTopicManager } from '~/forum/composables/state/useTopicManager'
import { useTopicOperationFeedback } from '~/forum/composables/view/useTopicOperationFeedback'
import { getSelectableTopicStatuses, groupTopicStatuses, TOPIC_STATUS_LABEL } from '~/forum/services/forumTopicStatus'
import { useForumRoute } from './useForumRoute'

/** Both the topic menu and the inline status picker use the same groups and actions. */
export function createTopicStatusGroupItems(
  definitions: readonly TopicStatusDefinition[],
  idPrefix: string,
  message: CustomConfig,
  disabled: boolean,
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
          label: message.forum.topic.statusGroups[group],
          // 结论状态会把未结反馈带走，「已结」这件事不写出来用户看不出来
          hint: grouped.some(definition => definition.hidesTopic)
            ? message.forum.topic.menu.modifyStatus.conclusiveHint
            : undefined,
        },
        ...grouped.map(definition => ({
          id: `${idPrefix}-${definition.id}`,
          type: 'item' as const,
          label: message.forum.topic.status[definition.id],
          status: definition.id,
          disabled,
          action: createAction(definition.id),
        })),
      ],
    })
  }
  return items
}

export function useTopicStatusMenu(topicData: MaybeRefOrGetter<ForumAPI.Topic>, message: Ref<CustomConfig>) {
  const currentTopic = computed(() => toValue(topicData))
  const menuLabels = computed(() => message.value.forum.topic.menu)
  const { setTopicStatus, updatingTopic } = useTopicManager(currentTopic, message, useTopicOperationFeedback())
  const { route, leaveTopic } = useForumRoute()
  const { hasAnyPermissions } = useRuleChecks(() => currentTopic.value.user.id)
  const canEdit = hasAnyPermissions('edit_feedback')
  async function handleSetTopicStatus(status: ForumAPI.TopicStatus | null) {
    if (!canEdit.value || updatingTopic.value)
      return
    const topicId = String(currentTopic.value.id)
    const wasOpen = currentTopic.value.state === 'open'
    const result = await setTopicStatus(status)
    if (!result)
      return
    if (wasOpen && result.state !== 'open' && route.value?.name === 'topic' && route.value.topicId === topicId)
      await leaveTopic()
  }

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

    items.push(...createTopicStatusGroupItems(
      getSelectableTopicStatuses(currentTopic.value.type, currentStatus),
      'status-topic',
      message.value,
      updatingTopic.value,
      status => () => handleSetTopicStatus(status),
    ))

    return items
  })

  return { items: statusSubmenuItems, canEdit, updatingTopic }
}
