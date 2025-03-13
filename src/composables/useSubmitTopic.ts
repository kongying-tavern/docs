import type ForumAPI from '@/apis/forum/api'
import { issues } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useData } from 'vitepress'
import { toRefs, watch } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import { composeTopicBody } from '~/composables/composeTopicBody'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { useForumData } from '~/stores/useForumData'

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
  const forumData = useForumData()
  const userAuth = useUserAuthStore()

  const { userSubmittedTopic } = toRefs(forumData)
  const { message } = useLocalized()
  const { lang } = useData()

  // 因为 Gitee 接口不识别普通用户上传的 tags(labels)，为了前端预览正常这里手动缓存并在后面与接口返回值合并
  let userSelectedTags: string[] | null = null

  const submitData = async (options: ForumAPI.CreateTopicOption) => {
    if (!userAuth.isTokenValid)
      return location.hash = 'login-alert'

    const { text, title, tags, type } = options

    userSelectedTags = tags

    const labels = [
      import.meta.env.DEV ? 'DEV-TEST' : 'WEB-FEEDBACK',
      typeLabelGetter.getLabel(type),
      localeLabelGetter.getLabel(lang.value.substring(0, 2).toUpperCase()),
      ...tags,
    ]

    const newTopic = {
      body: composeTopicBody(text, { labels }),
      title: `${type}:${title}`,
      labels: labels.join(','),
    }

    try {
      const result = await asyncSubmit(newTopic)
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
      toast.error(`${message.value.forum.publish.publishFail} (${error.message})`)
      return null
    }
  }

  watch(submittedTopic, () => {
    if (!submittedTopic.value)
      return
    userSubmittedTopic.value = [
      {
        ...submittedTopic.value,
        ...(userSelectedTags ? { tags: userSelectedTags } : {}),
      },
      ...userSubmittedTopic.value,
    ]
  })

  return {
    data: submittedTopic,
    loading: submitLoading,
    error: submitError,
    submitData,
  }
}
