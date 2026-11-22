import type { MaybeRefOrGetter } from 'vue'
import type { Composer } from 'vue-i18n'
import type ForumAPI from '@/src/forum/api/types.d.ts'
import type { FORUM } from '@/src/forum/shared/types.d.ts'
import { computed, toValue } from 'vue'
import { useRuleChecks } from '@/src/forum/hooks/auth/useRuleChecks.ts'
import { createTopicOperationFeedback } from '@/src/forum/lib/topicFeedback.ts'
import { useTopicManager } from './useTopicManager.ts'

export function useTopicTypeMenu(topicData: MaybeRefOrGetter<ForumAPI.Topic>, t: Composer['t']) {
  const currentTopic = computed(() => toValue(topicData))
  const { hasAnyPermissions } = useRuleChecks()
  const canManage = hasAnyPermissions('manage_feedback')
  const { toggleTopicType, updatingTopic } = useTopicManager(currentTopic, t, createTopicOperationFeedback())
  const topicTypes: ForumAPI.FeedbackTopicType[] = ['FEAT', 'BUG', 'ANN']

  async function changeType(type: ForumAPI.FeedbackTopicType) {
    if (!canManage.value || updatingTopic.value || currentTopic.value.type === type)
      return
    await toggleTopicType(type)
  }

  const items = computed<FORUM.MenuElement[]>(() => topicTypes
    .filter(type => type !== currentTopic.value.type)
    .map(type => ({
      id: `change-topic-${type}`,
      type: 'item',
      label: t(`forum.topic.type.${type.toLowerCase()}`),
      topicType: type,
      disabled: updatingTopic.value,
      action: () => changeType(type),
    })))

  return { items, canManage, updatingTopic }
}
