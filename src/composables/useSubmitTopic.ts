import type ForumAPI from '@/apis/forum/api'
import { useData } from 'vitepress'
import { useLocalized } from '@/hooks/useLocalized'
import { authGuards } from '@/utils/auth-helpers'
import { composeTopicBody } from '~/composables/composeTopicBody'
import { useForumMutations } from '~/composables/forum/useForumMutations'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { useRuleChecks } from '~/composables/useRuleChecks'

const typeLabelGetter = getTopicTypeLabelGetter()
const localeLabelGetter = getForumLocaleLabelGetter()

export function useSubmitTopic() {
  const { message } = useLocalized()
  const { lang } = useData()
  const forumMutations = useForumMutations()

  const submitData = async (options: ForumAPI.CreateTopicOption) => {
    if (!authGuards.requireLogin(message.value.forum.auth.loginTips))
      throw new Error('Authentication is required to publish a Topic.')

    const { text, title, tags, type } = options

    if (type === 'ANN') {
      const { hasAnyPermissions } = useRuleChecks()
      const hasPermission = hasAnyPermissions('manage_feedback')

      if (!hasPermission.value)
        throw new Error('Announcement permission is required.')
    }

    const labels = [
      import.meta.env.DEV ? 'DEV-TEST' : 'WEB-FEEDBACK',
      typeLabelGetter.getLabel(type),
      localeLabelGetter.getLabel(lang.value.substring(0, 2).toUpperCase()),
      ...tags,
    ]

    const newTopic = {
      body: composeTopicBody(text, { labels }),
      title: `${type}:${title.length === 0 ? `${text.substring(0, 12)}...` : title}`,
      labels: labels.join(','),
    }

    return forumMutations.createTopic(newTopic)
  }

  return {
    data: forumMutations.createdTopic,
    loading: forumMutations.creatingTopic,
    error: forumMutations.createTopicError,
    submitData,
  }
}
