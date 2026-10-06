import type { JSONContent } from '@tiptap/core'
import type { DecodedForumText } from './forumContentCodec'
import {
  renderJSONContentToString,
  serializeChildrenToHTMLString,
} from '@tiptap/static-renderer/json/html-string'
import DOMPurify from 'dompurify'
import { find } from 'linkifyjs'
import { SITE_ORIGIN } from '~/constants/site'
import { decodeForumText } from './forumContentCodec'
import { getForumDocumentTitle } from './forumDocumentLinkIndex'
import { forumTextToEditorDoc } from './forumLegacyContent'
import {
  FORUM_LINK_HOST_ALLOWLIST,
  getForumMentionHref,
  getUntrustedForumLinkHref,
  isAllowedForumHref,
  isSafeForumHref,
  SAFE_FORUM_URI_REGEX,
  shortenForumAutoLink,
} from './forumLinkPolicy'
import { TOPIC_ID_PATTERN } from './forumTopicQuote'

/** Matches an emoji filename extension. */
const EMOJI_FILE_EXTENSION_REGEX = /\.[^.]+$/

/** Matches forum Topic references and Gitee logins without linking email addresses. */
const FORUM_REFERENCE_REGEX = /(?<![\p{L}\p{N}_.+-])(?:#(?<topic>I[A-Z0-9]{5,})|@(?<mention>[\dA-Z][\w-]{0,63}))(?![\p{L}\p{N}_-])/giu

const MARKDOWN_LINK_PREFIX_REGEX = /!?\[[^\]]*\]\(\s*$/u

const AUTO_LINK_PROTOCOL_REGEX = /^https?:\/\//i

const FORUM_TOPIC_URL_PATH_REGEX = new RegExp(
  `/(?:[a-z-]+/)?feedback/topic/(?<topic>${TOPIC_ID_PATTERN})(?:/)?$`,
  'iu',
)

const JSON_LIKE_TEXT_REGEX = /^\s*[[{]/u

interface ForumTopicRenderOptions {
  topicHref?: (topicId: string) => string
  documentLinks?: Readonly<Record<string, string>>
}

const FORUM_HTML_SANITIZE_CONFIG = {
  ALLOWED_ATTR: [
    'alt',
    'class',
    'data-emoji',
    'href',
    'height',
    'rel',
    'src',
    'start',
    'target',
    'title',
    'width',
  ],
  ALLOWED_TAGS: [
    'a',
    'blockquote',
    'br',
    'code',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'img',
    'li',
    'ol',
    'p',
    'pre',
    's',
    'span',
    'strong',
    'u',
    'ul',
  ],
  ALLOWED_URI_REGEXP: SAFE_FORUM_URI_REGEX,
}

type RenderedForumComment
  = | { kind: 'plain', text: string }
    | { kind: 'html', html: string, text: string }

export function renderTiptapToHtml(doc: JSONContent, options: ForumTopicRenderOptions = {}): string {
  type RenderNode = Omit<JSONContent, 'type' | 'content'> & { type: string, content?: RenderNode[] }
  type RenderMark = NonNullable<JSONContent['marks']>[number]
  const normalize = (node: JSONContent): RenderNode => {
    const { type, content, ...rest } = node
    return { ...rest, type: type ?? '', content: content?.map(normalize) }
  }
  return renderJSONContentToString<RenderMark, RenderNode>({
    markMapping: {
      bold: ({ children }) => `<strong>${serializeChildrenToHTMLString(children)}</strong>`,
      italic: ({ children }) => `<em>${serializeChildrenToHTMLString(children)}</em>`,
      strike: ({ children }) => `<s>${serializeChildrenToHTMLString(children)}</s>`,
      underline: ({ children }) => `<u>${serializeChildrenToHTMLString(children)}</u>`,
      code: ({ children }) => `<code>${serializeChildrenToHTMLString(children)}</code>`,
      link: ({ mark, children }) => {
        const content = serializeChildrenToHTMLString(children)
        const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : ''
        return renderTiptapLink(href, content, options)
      },
    },
    nodeMapping: {
      doc: ({ children }) => serializeChildrenToHTMLString(children),
      paragraph: ({ children }) => `<p>${serializeChildrenToHTMLString(children)}</p>`,
      blockquote: ({ children }) => `<blockquote>${serializeChildrenToHTMLString(children)}</blockquote>`,
      bulletList: ({ children }) => `<ul>${serializeChildrenToHTMLString(children)}</ul>`,
      listItem: ({ children }) => `<li>${serializeChildrenToHTMLString(children)}</li>`,
      orderedList: ({ node, children }) => {
        const start = Number.isInteger(node.attrs?.start) ? node.attrs!.start : 1
        return `<ol${start === 1 ? '' : ` start=${start}`}>${serializeChildrenToHTMLString(children)}</ol>`
      },
      heading: ({ node, children }) => {
        const level = Number.isInteger(node.attrs?.level) && node.attrs!.level >= 1 && node.attrs!.level <= 6 ? node.attrs!.level : 1
        return `<h${level}>${serializeChildrenToHTMLString(children)}</h${level}>`
      },
      hardBreak: () => '<br>',
      horizontalRule: () => '<hr>',
      codeBlock: ({ node }) => `<pre><code>${escapeHtml(node.content?.map(child => child.text ?? '').join('') ?? '')}</code></pre>`,
      topicReference: ({ node }) => linkForumReferences(`#${String(node.attrs?.id || '')}`, options),
      emoji: ({ node }) => renderEmoji(node.attrs ?? {}),
      mention: ({ node }) => renderMention(node.attrs ?? {}),
      text: ({ node }) => node.marks?.some((mark: NonNullable<JSONContent['marks']>[number]) => mark.type === 'code' || mark.type === 'link')
        ? escapeHtml(node.text || '')
        : renderForumPlainText(node.text || '', options),
    },
  })({ content: normalize(doc) })
}

export function renderForumComment(
  content: DecodedForumText,
  options: ForumTopicRenderOptions = {},
): RenderedForumComment {
  if (content.kind === 'plain') {
    // Preserve the existing contract for JSON-looking legacy comments.
    if (JSON_LIKE_TEXT_REGEX.test(content.text))
      return content
    return {
      kind: 'html',
      html: sanitizeForumHtml(renderForumPlainText(content.text, options)),
      text: content.text,
    }
  }

  try {
    return {
      kind: 'html',
      html: sanitizeForumHtml(renderTiptapToHtml(content.doc, options)),
      text: content.text,
    }
  }
  catch {
    return { kind: 'plain', text: content.text }
  }
}

function renderTiptapLink(href: string, content: string, options: ForumTopicRenderOptions): string {
  if (!isAllowedForumHref(href)) {
    const destination = getUntrustedForumLinkHref(href)
    if (!destination)
      return content
    const label = shortenForumAutoLink(destination)
    return label === destination
      ? escapeHtml(destination)
      : `<span class="forum-external-link" title="${escapeAttribute(destination)}">${escapeHtml(label)}</span>`
  }

  const escapedHref = escapeHtml(href)
  const topicId = content === escapedHref ? getForumTopicIdFromUrl(href) : undefined
  const topicReferenceHref = topicId && options.topicHref?.(topicId)
  if (topicId && topicReferenceHref && isSafeForumHref(topicReferenceHref))
    return renderForumTopicReference(topicId, topicReferenceHref)

  const documentTitle = options.documentLinks && getForumDocumentTitle(href, options.documentLinks)
  if (documentTitle && content === escapedHref) {
    return `<a class="vp-link forum-document-link" href="${escapeAttribute(href)}" title="${escapeAttribute(href)}"><span aria-hidden="true" class="forum-document-link-icon i-lucide-file-text"></span>${escapeHtml(documentTitle)}</a>`
  }

  const isAutoLink = AUTO_LINK_PROTOCOL_REGEX.test(href) && content === escapedHref
  const label = isAutoLink ? escapeHtml(shortenForumAutoLink(href)) : content
  const className = isAutoLink ? 'vp-link forum-external-link' : 'vp-link'
  return `<a class="${className}" href="${escapeAttribute(href)}" rel="noopener noreferrer" target="_blank"${isAutoLink ? ` title="${escapeAttribute(href)}"` : ''}>${label}</a>`
}

/** 无协议链接：白名单域名自动补全协议；按 URL 字符集匹配避免吞入标点/中文 */
const SCHEMELESS_URL_REGEX = new RegExp(
  `(?<![\\w.:/])(?:${FORUM_LINK_HOST_ALLOWLIST.map(domain => domain.replaceAll('.', '\\.')).join('|')})/[\\w.~:/?#@!$&*+,;=%()-]+`,
  'g',
)

/** 链接尾部常见标点（中英文、全角括号），剥离后原样保留 */
const TRAILING_URL_PUNCTUATION = /[.,;:!?，。；：！？）)\]}]+$/

function normalizeSchemelessUrls(text: string): string {
  return text.replace(SCHEMELESS_URL_REGEX, (match, offset: number) => {
    const punct = match.match(TRAILING_URL_PUNCTUATION)?.[0] ?? ''
    const core = punct ? match.slice(0, -punct.length) : match
    if (isMarkdownUrlContext(text.slice(0, offset), `${punct}${text.slice(offset + match.length)}`))
      return match
    return `https://${core}${punct}`
  })
}

function renderForumPlainText(text: string, options: ForumTopicRenderOptions): string {
  const normalizedText = normalizeSchemelessUrls(text)
  const matches = find(normalizedText, 'url')

  let cursor = 0
  let html = ''

  for (const match of matches) {
    const index = match.start
    const raw = match.value
    html += linkForumReferences(normalizedText.slice(cursor, index), options)
    const before = normalizedText.slice(0, index)
    const after = normalizedText.slice(index + raw.length)
    html += isMarkdownUrlContext(before, after) || (before.endsWith('[') && raw.includes(']('))
      ? escapeHtml(raw)
      : renderTiptapLink(match.href, escapeHtml(raw), options)
    cursor = match.end
  }

  html += linkForumReferences(normalizedText.slice(cursor), options)
  return html.replaceAll('\n', '<br>\n')
}

function linkForumReferences(text: string, options: ForumTopicRenderOptions): string {
  let cursor = 0
  let html = ''
  for (const match of text.matchAll(FORUM_REFERENCE_REGEX)) {
    const index = match.index
    const topicId = match.groups?.topic
    const login = match.groups?.mention
    const href = topicId ? options.topicHref?.(topicId) : login ? getForumMentionHref(login) : undefined
    if (!href || (topicId ? !isSafeForumHref(href) : !isAllowedForumHref(href)))
      continue
    html += escapeHtml(text.slice(cursor, index))
    html += topicId
      ? `<a class="vp-link forum-topic-reference" href="${escapeAttribute(href)}">#${escapeHtml(topicId)}</a>`
      : `<a class="mention vp-link" href="${escapeAttribute(href)}" rel="noopener noreferrer" target="_blank">@${escapeHtml(login || '')}</a>`
    cursor = index + match[0].length
  }
  return html + escapeHtml(text.slice(cursor))
}

export function renderForumTopic(content: string | DecodedForumText, options: ForumTopicRenderOptions = {}): string {
  const decoded = typeof content === 'string' ? decodeForumText(content) : content
  try {
    return sanitizeForumHtml(renderTiptapToHtml(
      decoded.kind === 'tiptap' ? decoded.doc : forumTextToEditorDoc(decoded.text),
      options,
    ))
  }
  catch {
    return escapeHtml(decoded.text).replaceAll('\n', '<br>')
  }
}

export function renderForumTopicSummary(content: string | DecodedForumText, options: ForumTopicRenderOptions = {}): string {
  return renderForumTopic(content, options)
}

function sanitizeForumHtml(html: string): string {
  const sanitize = DOMPurify.sanitize
  if (typeof sanitize === 'function')
    return sanitize.call(DOMPurify, html, FORUM_HTML_SANITIZE_CONFIG)
  // Node（SSG/单测）没有 DOM：渲染结果是序列化中间产物，保持原样供测试断言；
  // 浏览器下 DOMPurify 不可用属异常状态，失败关闭退化为纯文本转义，绝不透传未消毒 HTML
  if (typeof window !== 'undefined')
    return escapeHtml(html)
  return html
}

function isMarkdownUrlContext(before: string, after: string): boolean {
  return (MARKDOWN_LINK_PREFIX_REGEX.test(before) && after.startsWith(')'))
    || ((before.endsWith('[') || before.endsWith('![')) && after.startsWith(']('))
    || (before.endsWith('](') && after.startsWith(')'))
    || (before.endsWith('<') && after.startsWith('>'))
}

function getForumTopicIdFromUrl(href: string): string | undefined {
  try {
    const url = new URL(href)
    if (url.hostname.toLowerCase() !== new URL(SITE_ORIGIN).hostname)
      return undefined
    return FORUM_TOPIC_URL_PATH_REGEX.exec(url.pathname)?.groups?.topic
  }
  catch {
    return undefined
  }
}

function renderForumTopicReference(topicId: string, href: string): string {
  return `<a class="vp-link forum-topic-reference" href="${escapeAttribute(href)}">#${escapeHtml(topicId)}</a>`
}

function renderEmoji(attrs: Readonly<Record<string, unknown>>): string {
  const emoji = String(attrs.emoji || '')
  const base = typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/'
  const src = `${base.endsWith('/') ? base : `${base}/`}emojis/${emoji.split('/').map(encodeURIComponent).join('/')}`
  const alt = emoji.split('/').at(-1)?.replace(EMOJI_FILE_EXTENSION_REGEX, '') || 'emoji'
  const width = positiveDimension(attrs.width)
  const height = positiveDimension(attrs.height)

  return `<img alt="${escapeAttribute(alt)}" data-emoji="${escapeAttribute(emoji)}" height="${height}" src="${escapeAttribute(src)}" title="${escapeAttribute(alt)}" width="${width}">`
}

function renderMention(attrs: Readonly<Record<string, unknown>>): string {
  const label = String(attrs.label || attrs.id || 'Unknown')
  const text = `@${escapeHtml(label)}`
  const href = getForumMentionHref(label)

  if (!href)
    return `<span class="mention">${text}</span>`

  return `<a class="mention vp-link" href="${escapeAttribute(href)}" rel="noopener noreferrer" target="_blank">${text}</a>`
}

function positiveDimension(value: unknown): number {
  const dimension = Number(value)
  return Number.isFinite(dimension) && dimension > 0 ? dimension : 20
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', '&quot;')
}
