import type ForumAPI from '@/apis/forum/api'
import { decodeTopicBody } from './forumContentCodec'
import { isCategoryLabel } from './forumLabel'
import { parseTopicLabels } from './forumTopicLabels'
import { normalizeQuotedTopicReference } from './forumTopicQuote'
import { getTopicStatus } from './forumTopicStatus'

export interface OptimisticTopicPatch {
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
    const quotedTopic = normalizeQuotedTopicReference(decoded.metadata.quotedTopic)
    next.contentRaw = patch.body
    next.content = {
      text: decoded.content.text,
      ...(decoded.attachments ? { images: decoded.attachments } : {}),
    }
    if (quotedTopic)
      next.quotedTopic = quotedTopic
    else
      delete next.quotedTopic
  }
  if (patch.labels !== undefined) {
    const labels = parseTopicLabels(patch.labels)
    const type = labels.find(label => TOPIC_TYPE_LABEL.test(label))?.slice(4).toUpperCase()
    next.pinned = labels.includes('PINNED')
    next.commentCount = labels.includes('COMMENT-CLOSED') ? -1 : Math.max(0, topic.commentCount)
    next.labels = labels
    next.tags = labels.filter(isCategoryLabel)
    next.status = getTopicStatus(labels)
    next.goodIssue = labels.includes('GOOD-ISSUE')
    if (type)
      next.type = type as ForumAPI.FeedbackTopicType
  }

  return next
}

/**
 * Gitee can acknowledge a write before its response reflects the updated
 * labels/state. Keep the acknowledged patch visible until the authoritative
 * list refresh completes, while retaining server-owned response fields.
 */
export function mergeAcknowledgedTopicPatch(
  topic: ForumAPI.Topic,
  patch: OptimisticTopicPatch,
): ForumAPI.Topic {
  return {
    ...applyOptimisticTopicPatch(topic, patch),
    updatedAt: topic.updatedAt,
  }
}
