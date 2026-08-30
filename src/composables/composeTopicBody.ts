import type ForumAPI from '@/apis/forum/api'
import { uniq } from 'lodash-es'
import { updateTopicMetadata } from '~/services/forum/forumContentCodec'

export function composeTopicBody(
  body: string,
  options: {
    labels?: (string | null | undefined)[]
    state?: ForumAPI.TopicState
  },
): string {
  const { labels, state } = options

  const meta = {
    ...(labels ? { labels: uniq(labels.filter(v => v)) } : {}),
    ...(state ? { state } : {}),
  }

  return writeTopicBodyComment(body, meta)
}

export function writeTopicBodyComment(
  body: string,
  params: Record<string, unknown>,
): string {
  return updateTopicMetadata(body, params)
}
