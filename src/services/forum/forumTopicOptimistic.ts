import type ForumAPI from '@/apis/forum/api'
import { decodeTopicBody } from './forumContentCodec'
import { parseTopicLabels } from './forumTopicLabels'

interface OptimisticTopicPatch {
  title?: string
  body?: string
  state?: ForumAPI.TopicState
  labels?: string
}

const TOPIC_TYPE_PREFIX = /^(?:ANN|BUG|FEAT):/i
const TOPIC_TYPE_LABEL = /^TYP-(?:ANN|BUG|FEAT)$/i

export function applyOptimisticTopicPatch(
  topic: ForumAPI.Topic,
  patch: OptimisticTopicPatch,
): ForumAPI.Topic {
  const next = { ...topic, updatedAt: new Date().toISOString() }

  if (patch.title !== undefined)
    next.title = patch.title.replace(TOPIC_TYPE_PREFIX, '').trim()
  if (patch.state !== undefined)
    next.state = patch.state
  if (patch.body !== undefined) {
    const decoded = decodeTopicBody(patch.body)
    next.contentRaw = patch.body
    next.content = {
      text: decoded.content.text,
      ...(decoded.attachments ? { images: decoded.attachments } : {}),
    }
  }
  if (patch.labels !== undefined) {
    const labels = parseTopicLabels(patch.labels)
    const type = labels.find(label => TOPIC_TYPE_LABEL.test(label))?.slice(4).toUpperCase()
    next.pinned = labels.includes('PINNED')
    next.commentCount = labels.includes('COMMENT-CLOSED') ? -1 : Math.max(0, topic.commentCount)
    next.tags = labels
    if (type)
      next.type = type as Exclude<ForumAPI.TopicType, null>
  }

  return next
}
