import type ForumAPI from '@/apis/forum/api'
import { endsWith, startsWith, uniq } from 'lodash-es'

/** Matches HTML comments in topic body */
const HTML_COMMENT_SPLIT_REGEX = /(<!--.*(?=-->)-->)/gu

/** Matches HTML comment start/end tags */
const HTML_COMMENT_TAGS_REGEX = /^<!--|-->$/gu

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
  if (!body)
    return ''

  const chunks = body.split(HTML_COMMENT_SPLIT_REGEX)
  const chunksComments = chunks.filter(
    v => startsWith(v, '<!--') && endsWith(v, '-->'),
  )
  const chunksContents = chunks.filter(
    v => !startsWith(v, '<!--') || !endsWith(v, '-->'),
  )

  const chunksJson = chunksComments
    ? chunksComments.reduce((json, comment) => {
        const commentContent = (comment || '')
          .replace(HTML_COMMENT_TAGS_REGEX, '')
          .trim()
        let newJson = json

        try {
          const commentJson = JSON.parse(commentContent)
          newJson = { ...json, ...commentJson }
        }
        catch {}

        return newJson
      }, {})
    : {}

  return `<!-- ${JSON.stringify({ ...chunksJson, ...params })} -->${chunksContents.join('')}`
}
