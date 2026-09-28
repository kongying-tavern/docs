import type ForumAPI from '~/forum/api/types'
import { useQueryCache } from '@pinia/colada'
import { useData } from 'vitepress'
import { useLocalized } from '@/hooks/useLocalized'
import { reactions } from '~/apis/interknot.site'
import { authGuards } from '~/forum/composables/auth/auth-helpers'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumTopicMutations } from '~/forum/composables/data/useForumMutations'
import { composeTopicBody } from '~/forum/composables/util/composeTopicBody'
import { forumKeys } from '~/forum/services/forumQueryContracts'
import { reactionEnvironmentForOrigin, recordPublishedTopicQuote } from '~/forum/services/forumReaction'
import { buildTopicCreationLabels } from '~/forum/services/forumTopicLabels'
import { getForumLocaleLabelGetter } from '~/forum/services/getForumLocaleGetter'
import { toast } from '~/services/telemetry/toast'

const localeLabelGetter = getForumLocaleLabelGetter()

export function useSubmitTopic() {
  const { message } = useLocalized()
  const { lang } = useData()
  const forumMutations = useForumTopicMutations()
  const queryCache = useQueryCache()

  const submitData = async (options: ForumAPI.CreateTopicOption) => {
    if (!authGuards.requireLogin(message.value.forum.auth.loginTips))
      throw new Error('Authentication is required to publish a Topic.')

    const { text, title, tags, type, quotedTopic } = options

    if (type === 'ANN') {
      const { hasAnyPermissions } = useRuleChecks()
      const hasPermission = hasAnyPermissions('manage_feedback')

      if (!hasPermission.value)
        throw new Error('Announcement permission is required.')
    }

    const labels = buildTopicCreationLabels(
      type,
      import.meta.env.DEV ? 'DEV-TEST' : 'WEB-FEEDBACK',
      localeLabelGetter.getLabel(lang.value.substring(0, 2).toUpperCase()),
      tags,
    )

    const newTopic = {
      body: composeTopicBody(text, { labels, quotedTopic }),
      title: `${type}:${title.length === 0 ? `${text.substring(0, 12)}...` : title}`,
      labels: labels.join(','),
    }

    const topic = await forumMutations.createTopic(newTopic)

    // This write is keyed by the newly published topic, never by opening the
    // quote form. A count-sync failure must not turn a real publication into a
    // form failure that encourages the user to submit the topic again.
    try {
      const resourceUrl = await recordPublishedTopicQuote(
        topic,
        reactionEnvironmentForOrigin(location.origin),
        (url, userId) => reactions.setPageReaction('like', { url, userId }),
      )
      if (resourceUrl)
        void queryCache.invalidateQueries({ key: forumKeys.reactionResource(resourceUrl) }).catch(() => {})
    }
    catch (error) {
      toast.warning(message.value.forum.topic.quote.countSyncFailed, { error, scene: 'rc' })
    }

    return topic
  }

  return {
    data: forumMutations.createdTopic,
    loading: forumMutations.creatingTopic,
    error: forumMutations.createTopicError,
    submitData,
  }
}
