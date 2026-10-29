import type { MaybeRefOrGetter } from 'vue'
import type { Composer } from 'vue-i18n'
import type ForumAPI from '~/forum/api/types'
import type { FORUM } from '~/forum/components/types'
import { computed, toValue } from 'vue'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useTopicOperationFeedback } from '~/forum/composables/view/useTopicOperationFeedback'
import { useTopicManager } from './useTopicManager'

export function useTopicTypeMenu(topicData: MaybeRefOrGetter<ForumAPI.Topic>, t: Composer['t']) {
  const currentTopic = computed(() => toValue(topicData))
  const { hasAnyPermissions } = useRuleChecks()
  const canManage = hasAnyPermissions('manage_feedback')
  const { toggleTopicType, updatingTopic } = useTopicManager(currentTopic, t, useTopicOperationFeedback())
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
