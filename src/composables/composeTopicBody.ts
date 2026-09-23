import type ForumAPI from '@/apis/forum/api'
import { uniq } from 'lodash-es'
import { updateTopicMetadata } from '~/services/forum/forumContentCodec'
import { replaceTopicTypeLabel } from '~/services/forum/forumTopicLabels'

export function composeTopicBody(
  body: string,
  options: {
    labels?: (string | null | undefined)[]
    state?: ForumAPI.TopicState
    quotedTopic?: ForumAPI.QuotedTopicReference
  },
): string {
  const { labels, state, quotedTopic } = options

  const meta = {
    ...(labels ? { labels: uniq(labels.filter(v => v)) } : {}),
    ...(state ? { state } : {}),
    ...(quotedTopic ? { quotedTopic } : {}),
  }

  return writeTopicBodyComment(body, meta)
}

export function writeTopicBodyComment(
  body: string,
  params: Record<string, unknown>,
): string {
  return updateTopicMetadata(body, params)
}

/** 类型标签是主来源；正文元数据供 Webhook 同步，标题无需改变。 */
export function buildTopicTypeChangePatch(topic: ForumAPI.Topic, type: ForumAPI.FeedbackTopicType) {
  const labels = replaceTopicTypeLabel(topic.labels ?? topic.tags, type)
  return {
    labels: labels.join(','),
    body: composeTopicBody(topic.contentRaw, { labels }),
  }
}
