import type ForumAPI from '@/apis/forum/api'
import { useMutation } from '@pinia/colada'
import { useData } from 'vitepress'
import { watch } from 'vue'
import { toast } from 'vue-sonner'
import { issues } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { authGuards } from '@/utils/auth-helpers'
import { composeTopicBody } from '~/composables/composeTopicBody'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { forumEvents } from '~/services/events/SimpleEventManager'

const typeLabelGetter = getTopicTypeLabelGetter()
const localeLabelGetter = getForumLocaleLabelGetter()

export function useSubmitTopic() {
  const { message } = useLocalized()
  const { lang } = useData()

  let userSelectedTags: string[] | null = null

  const { data: submittedTopic, mutateAsync: asyncSubmit, isLoading: submitLoading, error: submitError } = useMutation({
    mutation: issues.postTopic,
  })

  const submitData = async (options: ForumAPI.CreateTopicOption) => {
    if (!authGuards.requireLogin(message.value.forum.auth.loginTips))
      return

    const { text, title, tags, type } = options

    if (type === 'ANN') {
      const { hasAnyPermissions } = useRuleChecks()
      const hasPermission = hasAnyPermissions('manage_feedback')

      if (!hasPermission.value) {
        toast.error('权限不足：只有管理员可以发布公告类型的内容')
        return
      }
    }

    userSelectedTags = tags

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

    try {
      forumEvents.formSubmitStart('topic')

      const result = await asyncSubmit(newTopic)

      forumEvents.formSubmitSuccess('topic', result)

      toast.promise(Promise.resolve(result), {
        loading: message.value.forum.publish.publishLoading,
        success: (data: ForumAPI.Topic) =>
          `${message.value.forum.publish.publishSuccess}${data.title}`,
        error: (error: Error) =>
          `${message.value.forum.publish.publishFail} (${error.message})`,
      })
      return result
    }
    catch (err) {
      const error = err as Error

      forumEvents.formSubmitError('topic', error)

      toast.error(`${message.value.forum.publish.publishFail} (${error.message})`)
      return null
    }
  }

  watch(submittedTopic, () => {
    if (!submittedTopic.value)
      return

    const newTopic = {
      ...submittedTopic.value,
      ...(userSelectedTags ? { tags: userSelectedTags } : {}),
    }

    forumEvents.topicCreated(newTopic)
  })

  return {
    data: submittedTopic,
    loading: submitLoading,
    error: submitError,
    submitData,
  }
}
