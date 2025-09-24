import type ForumAPI from '@/apis/forum/api'
import { useData } from 'vitepress'
import { watch } from 'vue'
import { useRequest } from 'vue-request'
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
  const {
    data: submittedTopic,
    runAsync: asyncSubmit,
    loading: submitLoading,
    error: submitError,
  } = useRequest(issues.postTopic, {
    manual: true,
  })
  const { message } = useLocalized()
  const { lang } = useData()

  // 因为 Gitee 接口不识别普通用户上传的 tags(labels)，为了前端预览正常这里手动缓存并在后面与接口返回值合并
  let userSelectedTags: string[] | null = null

  const submitData = async (options: ForumAPI.CreateTopicOption) => {
    if (!authGuards.requireLogin(message.value.forum.auth.loginTips))
      return

    const { text, title, tags, type } = options

    // 权限验证：检查ANN类型topic的权限
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
      // Emit form submit start event
      forumEvents.formSubmitStart('topic')

      const result = await asyncSubmit(newTopic)

      // Emit form submit success event
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

      // Emit form submit error event
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

    // Only emit topic created event - let the stores handle adding it to their lists
    forumEvents.topicCreated(newTopic)
  })

  return {
    data: submittedTopic,
    loading: submitLoading,
    error: submitError,
    submitData,
  }
}
