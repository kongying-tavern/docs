import { issues } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { createGlobalState, watchOnce } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { useForumData } from '~/stores/useForumData'
import { executeWithAuth } from './executeWithAuth'
import { composeTopicBody } from './composeTopicBody'
import { storeToRefs } from 'pinia'
import { useRequest } from 'vue-request'

import { isArray } from 'lodash-es'
import { convertMultipleToMarkdown } from '~/components/forum/utils'
import { watch } from 'vue'
import { useData } from 'vitepress'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'

import type ForumAPI from '@/apis/forum/api'

export const useTopicMannger = createGlobalState(() => {
  const forumData = useForumData()
  const typeLabelGetter = getTopicTypeLabelGetter()
  const localeLabelGetter = getForumLocaleLabelGetter()

  const { topics, userSubmittedTopic } = storeToRefs(forumData)
  const { message } = useLocalized()
  const { lang } = useData()

  const getTopic = (id: string | number) => {
    return [...topics.value, ...userSubmittedTopic.value].find(
      (topic) => topic.id === id,
    )
  }

  const closeTopic = async (id: string | number): Promise<boolean> => {
    const targetTopic = getTopic(id)

    if (!targetTopic) {
      toast.error(message.value.forum.topic.menu.closeFeedback.fail)
      return false
    }

    const state = await executeWithAuth(
      issues.putTopic,
      [
        id,
        {
          body: composeTopicBody(targetTopic.contentRaw, { state: 'closed' }),
          state: 'closed',
        },
      ],
      message.value.forum.topic.menu.closeFeedback.success,
      message.value.forum.topic.menu.closeFeedback.fail,
      message,
    )
    if (state) removeTopic(id)
    return !state
  }

  const hidleTopic = async (id: string | number): Promise<boolean> => {
    const state = await executeWithAuth(
      issues.putTopic,
      [id, { state: 'progressing' }],
      message.value.forum.topic.menu.hideFeedback.success,
      message.value.forum.topic.menu.hideFeedback.fail,
      message,
    )
    if (state) removeTopic(id)
    return !state
  }

  const removeTopic = (id: string | number) => {
    topics.value = topics.value.filter((topic) => topic.id !== id)
    userSubmittedTopic.value = userSubmittedTopic.value.filter(
      (topic) => topic.id !== id,
    )
  }

  const submitTopic = () => {
    const {
      data: submittedTopic,
      runAsync: asyncSubmit,
      loading: submitLoading,
      error: submitError,
    } = useRequest(issues.postTopic, {
      manual: true,
    })

    // 因为 Gitee 接口不识别普通用户上传的 tags(labels)，为了前端预览正常这里手动缓存并在后面与接口返回值合并
    let userSelectedTags: string[] | null = null

    const submitData = (options: ForumAPI.CreateTopicOption) => {
      const { body, title, tags, type } = options

      const bodyText = () => {
        if (!isArray(body?.images)) return body.text
        return (
          body.text +
          convertMultipleToMarkdown(
            body.images
              .map((image) => image.url)
              .filter((url): url is string => !!url),
          )
        )
      }

      userSelectedTags = tags

      const labels = [
        import.meta.env.DEV ? 'DEV-TEST' : 'WEB-FEEDBACK',
        typeLabelGetter.getLabel(type),
        localeLabelGetter.getLabel(lang.value.substring(0, 2).toUpperCase()),
        ...tags,
      ]

      const result = asyncSubmit({
        body: composeTopicBody(bodyText(), { labels }),
        title: `${type}:${title}`,
        labels: labels.join(','),
      })

      toast.promise(result, {
        loading: message.value.forum.publish.publishLoading,
        success: (data: ForumAPI.Topic) =>
          `${message.value.forum.publish.publishSuccess}${data.title}`,
        error: (error: Error) =>
          `${message.value.forum.publish.publishFail} (${error.message})`,
      })
    }

    watch(submittedTopic, () => {
      if (!submittedTopic.value) return

      userSubmittedTopic.value.unshift({
        ...submittedTopic.value,
        ...(userSelectedTags ? { tags: userSelectedTags } : {}),
      })
    })

    return {
      data: submittedTopic,
      loading: submitLoading,
      error: submitError,
      runAsync: submitData,
    }
  }

  return {
    submitTopic,
    closeTopic,
    hidleTopic,
    getTopic,
  }
})
