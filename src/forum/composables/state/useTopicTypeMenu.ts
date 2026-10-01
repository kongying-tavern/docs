import type { MaybeRefOrGetter, Ref } from 'vue'
import type ForumAPI from '~/forum/api/types'
import type { FORUM } from '~/forum/components/types'
import type { CustomConfig } from '~/forum/types'
import { computed, toValue } from 'vue'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useTopicOperationFeedback } from '~/forum/composables/view/useTopicOperationFeedback'
import { useTopicManager } from './useTopicManager'

export function useTopicTypeMenu(topicData: MaybeRefOrGetter<ForumAPI.Topic>, message: Ref<CustomConfig>) {
  const currentTopic = computed(() => toValue(topicData))
  const { hasAnyPermissions } = useRuleChecks()
  const canManage = hasAnyPermissions('manage_feedback')
  const { toggleTopicType, updatingTopic } = useTopicManager(currentTopic, message, useTopicOperationFeedback())
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
      label: message.value.forum.topic.type[type.toLowerCase() as keyof typeof message.value.forum.topic.type],
      topicType: type,
      disabled: updatingTopic.value,
      action: () => changeType(type),
    })))

  return { items, canManage, updatingTopic }
}
