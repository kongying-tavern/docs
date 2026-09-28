import type ForumAPI from '~/forum/api/types'
import { uniq } from 'lodash-es'
import { updateTopicMetadata } from '~/forum/services/forumContentCodec'
import { replaceTopicTypeLabel } from '~/forum/services/forumTopicLabels'

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
  return buildTopicMembershipPatch(topic, { labels })
}

/** 标签与状态的请求字段和 Webhook 正文元数据必须表示同一目标值。 */
export function buildTopicMembershipPatch(
  topic: ForumAPI.Topic,
  changes: { labels?: readonly string[], state?: ForumAPI.TopicState },
) {
  const labels = uniq([...(changes.labels ?? topic.labels ?? topic.tags)])
  const state = changes.state ?? topic.state
  return {
    labels: labels.join(','),
    state,
    body: composeTopicBody(topic.contentRaw, { labels, state }),
  }
}
