import type { FORUM } from '~/forum/components/types'
import type { ForumFilter, ForumSort, ForumTopicType } from '~/forum/services/route'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { FORUM_VIEW_MODES, getViewModeIconClass } from '~/forum/composables/state/useForumViewMode'

export function useForumListControlOptions() {
  const { message } = useLocalized()
  const { hasAnyRoles } = useRuleChecks()
  const canViewArchived = hasAnyRoles('teamMember', 'feedbackMember')

  const filters = computed(() => {
    const navigation = message.value.forum.header.navigation
    const items: Array<{ id: ForumFilter, label: string, hint?: string }> = [
      { id: 'all', label: navigation.allFeedback },
      { id: 'closed', label: navigation.closedFeedback },
      { id: 'everything', label: navigation.everythingFeedback },
    ]
    if (canViewArchived.value)
      items.push({ id: 'archived', label: navigation.archivedFeedback, hint: navigation.adminOnly })
    return items
  })

  const types = computed<Array<{ id: ForumTopicType, label: string }>>(() => [
    { id: 'all', label: message.value.forum.header.navigation.allTypes },
    { id: 'bug', label: message.value.forum.topic.type.bug },
    { id: 'feat', label: message.value.forum.topic.type.feat },
  ])

  const sorts = computed<Array<{ id: ForumSort, label: string }>>(() => [
    { id: 'created', label: message.value.forum.header.sort.created },
    { id: 'updated', label: message.value.forum.header.sort.updated },
  ])

  const views = computed<Array<{ id: FORUM.TopicViewMode, label: string, icon: string }>>(() =>
    FORUM_VIEW_MODES.map(mode => ({
      id: mode,
      label: mode === 'CARD' ? message.value.forum.header.view.card : message.value.forum.header.view.compact,
      icon: getViewModeIconClass(mode),
    })),
  )

  return { filters, types, sorts, views }
}
