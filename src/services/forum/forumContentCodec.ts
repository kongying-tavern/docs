import type { JSONContent } from '@tiptap/core'
import type ForumAPI from '@/apis/forum/api'

/** Matches the legacy Topic metadata comments used by composeTopicBody. */
const TOPIC_COMMENT_SPLIT_REGEX = /(<!--.*(?=-->)-->)/gu

/** Matches HTML comment start/end tags. */
const HTML_COMMENT_TAGS_REGEX = /^<!--|-->$/gu

/** Matches Markdown image syntax with the existing optional metadata grammar. */
const MARKDOWN_IMAGE_REGEX = /!\[(.*?)\]\((.*?)\)\s*(\{[^}]*\})?/g

/** Matches HTML comments removed by provider normalization. */
const HTML_COMMENT_REGEX = /<!--.*?-->/gs

/** Matches CRLF line endings. */
const CRLF_LINE_ENDING_REGEX = /\r\n/g

/** Matches a quoted metadata value. */
const LEADING_TRAILING_QUOTE_REGEX = /^"|"$/g

/** Matches excess trailing newlines from Tiptap block content. */
const MULTIPLE_NEWLINES_END_REGEX = /\n{3,}$/

const SUPPORTED_TIPTAP_NODES = new Set([
  'blockquote',
  'bulletList',
  'codeBlock',
  'doc',
  'emoji',
  'hardBreak',
  'heading',
  'horizontalRule',
  'listItem',
  'mention',
  'orderedList',
  'paragraph',
  'text',
])

const SUPPORTED_TIPTAP_MARKS = new Set([
  'bold',
  'code',
  'italic',
  'link',
  'strike',
  'underline',
])

export type DecodedForumText
  = | { kind: 'plain', text: string }
    | { kind: 'tiptap', doc: JSONContent, text: string }

export interface ForumAttachment extends ForumAPI.ImageInfo {}

export interface TopicMetadata {
  labels?: string[]
  state?: ForumAPI.TopicState
  [key: string]: unknown
}

export interface DecodedForumBody {
  content: DecodedForumText
  attachments?: ForumAttachment[]
}

export interface DecodedTopicBody extends DecodedForumBody {
  content: Extract<DecodedForumText, { kind: 'plain' }>
  metadata: TopicMetadata
}

/**
 * Updates the legacy, unnamespaced Topic metadata comment without changing its
 * persisted representation. Successfully parsed arbitrary JSON comments remain
 * intentionally ambiguous for backward compatibility.
 */
export function updateTopicMetadata(
  body: string,
  patch: TopicMetadata,
): string {
  if (!body)
    return ''

  const { comments, content } = splitTopicComments(body)
  const metadata = mergeJsonComments(comments)

  return `<!-- ${JSON.stringify({ ...metadata, ...patch })} -->${content}`
}

export function encodeTopicBody(body: string, metadata: TopicMetadata): string {
  return updateTopicMetadata(body, metadata)
}

export function decodeTopicBody(body?: string): DecodedTopicBody {
  const source = body ?? ''
  const { comments } = splitTopicComments(source)
  const { text, attachments } = parseAttachmentMarkdown(source)

  return {
    content: { kind: 'plain', text },
    metadata: mergeJsonComments(comments),
    ...(attachments.length ? { attachments } : {}),
  }
}

export function encodeCommentBody(
  content: string | JSONContent,
  attachments: ForumAttachment[] = [],
): string {
  const text = typeof content === 'string' ? content : JSON.stringify(content)
  return text + formatAttachmentMarkdownList(attachments)
}

export function decodeCommentBody(body?: string): DecodedForumBody {
  const { text, attachments } = parseAttachmentMarkdown(body)

  return {
    content: decodeForumText(text),
    ...(attachments.length ? { attachments } : {}),
  }
}

export function decodeForumText(text: string): DecodedForumText {
  try {
    const value: unknown = JSON.parse(text)
    if (isSupportedTiptapDoc(value)) {
      return {
        kind: 'tiptap',
        doc: value,
        text: tiptapDocToText(value).replace(MULTIPLE_NEWLINES_END_REGEX, '\n\n'),
      }
    }
  }
  catch {}

  return { kind: 'plain', text }
}

export function formatAttachmentMarkdown(attachment: ForumAttachment): string {
  const alt = attachment.alt || 'Uploaded image'
  const metadataPairs = attachment.thumbHash
    ? [
        `thumbhash:"${attachment.thumbHash}"`,
        ...(isValidDimension(attachment.width) ? [`width:"${attachment.width}"`] : []),
        ...(isValidDimension(attachment.height) ? [`height:"${attachment.height}"`] : []),
      ]
    : []
  const metadata = metadataPairs.length ? `{${metadataPairs.join(',')}}` : ''

  return `![${alt}](${attachment.src})${metadata}`
}

export function formatAttachmentMarkdownList(attachments: ForumAttachment[]): string {
  if (!attachments.length)
    return ''

  return `\n${attachments.map(formatAttachmentMarkdown).join('\n')}`
}

export function parseAttachmentMarkdown(markdown?: string): {
  text: string
  attachments: ForumAttachment[]
} {
  if (!markdown)
    return { text: '', attachments: [] }

  const attachments: ForumAttachment[] = []
  const text = markdown
    .replace(MARKDOWN_IMAGE_REGEX, (_match, altText: string, src: string, meta?: string) => {
      const parsedMetadata = parseAttachmentMetadata(meta)
      attachments.push({
        src: src.replace(
          'webp.assets.inter-knot.site',
          'webp.assets.interknot.site',
        ),
        ...(altText ? { alt: altText } : {}),
        ...parsedMetadata,
      })
      return ''
    })
    .replace(HTML_COMMENT_REGEX, '')
    .trim()
    .replace(CRLF_LINE_ENDING_REGEX, '\n')
    .trim()

  return { text, attachments }
}

function parseAttachmentMetadata(meta?: string): Partial<ForumAttachment> {
  if (!meta)
    return {}

  const result: Partial<ForumAttachment> = {}
  const pairs = meta.slice(1, -1).trim().split(',')

  for (const pair of pairs) {
    const [key, rawValue] = pair.split(':').map(item => item.trim())
    if (!rawValue)
      continue

    const value = rawValue.replace(LEADING_TRAILING_QUOTE_REGEX, '')
    if (key === 'thumbhash') {
      result.thumbHash = value
      continue
    }

    if (key === 'width' || key === 'height') {
      const dimension = Number(value)
      if (Number.isFinite(dimension) && dimension > 0)
        result[key] = dimension
    }
  }

  return result
}

function splitTopicComments(body: string): {
  comments: string[]
  content: string
} {
  const chunks = body.split(TOPIC_COMMENT_SPLIT_REGEX)
  const comments = chunks.filter(isHtmlComment)
  return {
    comments,
    content: chunks.filter(chunk => !isHtmlComment(chunk)).join(''),
  }
}

function isHtmlComment(value: string): boolean {
  return value.startsWith('<!--') && value.endsWith('-->')
}

function mergeJsonComments(comments: string[]): TopicMetadata {
  return comments.reduce<TopicMetadata>((metadata, comment) => {
    const content = comment.replace(HTML_COMMENT_TAGS_REGEX, '').trim()
    try {
      const parsed: unknown = JSON.parse(content)
      return Object.assign(metadata, parsed)
    }
    catch {
      return metadata
    }
  }, {})
}

function isSupportedTiptapDoc(value: unknown): value is JSONContent {
  return isRecord(value)
    && value.type === 'doc'
    && Array.isArray(value.content)
    && value.content.length > 0
    && isSupportedTiptapNode(value)
}

function isSupportedTiptapNode(value: unknown): value is JSONContent {
  if (!isRecord(value) || typeof value.type !== 'string' || !SUPPORTED_TIPTAP_NODES.has(value.type))
    return false

  if (value.attrs !== undefined && !isRecord(value.attrs))
    return false

  if (value.type === 'text' && typeof value.text !== 'string')
    return false

  if (value.text !== undefined && typeof value.text !== 'string')
    return false

  if (value.marks !== undefined) {
    if (!Array.isArray(value.marks) || !value.marks.every(isSupportedTiptapMark))
      return false
  }

  return value.content === undefined
    || (Array.isArray(value.content) && value.content.every(isSupportedTiptapNode))
}

function isSupportedTiptapMark(value: unknown): boolean {
  return isRecord(value)
    && typeof value.type === 'string'
    && SUPPORTED_TIPTAP_MARKS.has(value.type)
    && (value.attrs === undefined || isRecord(value.attrs))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function tiptapDocToText(node: JSONContent): string {
  if (node.type === 'text')
    return node.text || ''
  if (node.type === 'paragraph')
    return `${node.content?.map(tiptapDocToText).join('') ?? ''}\n`
  if (node.type === 'hardBreak')
    return '\n'
  if (node.type === 'emoji')
    return String(node.attrs?.emoji || '')
  if (node.type === 'mention')
    return `@${node.attrs?.label || ''}`
  return node.content?.map(tiptapDocToText).join('') ?? ''
}
