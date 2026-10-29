import type { FORUM } from '~/forum/components/types'
import type { ForumFilter, ForumSort, ForumTopicType } from '~/forum/services/forumRoute'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { FORUM_VIEW_MODES, getViewModeIconClass } from '~/forum/composables/state/useForumViewMode'

export function useForumListControlOptions() {
  const { t } = useI18n({ useScope: 'global' })
  const { hasAnyRoles } = useRuleChecks()
  const canViewArchived = hasAnyRoles('teamMember', 'feedbackMember')

  const filters = computed(() => {
    const items: Array<{ id: ForumFilter, label: string, hint?: string }> = [
      { id: 'all', label: t('forum.header.navigation.allFeedback') },
      { id: 'closed', label: t('forum.header.navigation.closedFeedback') },
      { id: 'everything', label: t('forum.header.navigation.everythingFeedback') },
    ]
    if (canViewArchived.value)
      items.push({ id: 'archived', label: t('forum.header.navigation.archivedFeedback'), hint: t('forum.header.navigation.adminOnly') })
    return items
  })

  const types = computed<Array<{ id: ForumTopicType, label: string }>>(() => [
    { id: 'all', label: t('forum.header.navigation.allTypes') },
    { id: 'bug', label: t('forum.topic.type.bug') },
    { id: 'feat', label: t('forum.topic.type.feat') },
  ])

  const sorts = computed<Array<{ id: ForumSort, label: string }>>(() => [
    { id: 'created', label: t('forum.header.sort.created') },
    { id: 'updated', label: t('forum.header.sort.updated') },
  ])

  const views = computed<Array<{ id: FORUM.TopicViewMode, label: string, icon: string }>>(() =>
    FORUM_VIEW_MODES.map(mode => ({
      id: mode,
      label: mode === 'CARD' ? t('forum.header.view.card') : t('forum.header.view.compact'),
      icon: getViewModeIconClass(mode),
    })),
  )

  return { filters, types, sorts, views }
}
