import type { JSONContent } from '@tiptap/core'
import type StateCore from 'markdown-it/lib/rules_core/state_core.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import type { DecodedForumText } from './forumContentCodec'
import {
  renderToHTMLString,
  serializeChildrenToHTMLString,
} from '@tiptap/static-renderer/pm/html-string'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { getForumDocumentTitle } from './forumDocumentLinkIndex'
import {
  FORUM_LINK_HOST_ALLOWLIST,
  getForumMentionHref,
  isAllowedForumHref,
  isSafeForumHref,
  SAFE_FORUM_URI_REGEX,
  shortenForumAutoLink,
} from './forumLinkPolicy'
import { createForumContentExtensions } from './forumTiptapExtensions'

/** Matches an emoji filename extension. */
const EMOJI_FILE_EXTENSION_REGEX = /\.[^.]+$/

/** Matches forum Topic references and Gitee logins without linking email addresses. */
const FORUM_REFERENCE_REGEX = /(?<![\p{L}\p{N}_.+-])(?:#(?<topic>I[A-Z0-9]{5,})|@(?<mention>[\dA-Z][\w-]{0,63}))(?![\p{L}\p{N}_-])/giu

const MARKDOWN_LINK_PREFIX_REGEX = /!?\[[^\]]*\]\(\s*$/u

const AUTO_LINK_PROTOCOL_REGEX = /^https?:\/\//i

const JSON_LIKE_TEXT_REGEX = /^\s*[[{]/u

const TOPIC_CODE_FENCE_MARKER_REGEX = /^( {0,3})(`{3,}|~{3,})/gm

const TOPIC_MARKDOWN = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
})

TOPIC_MARKDOWN.core.ruler.before('linkify', 'forum-schemeless-links', normalizeSchemelessLinkTokens)
TOPIC_MARKDOWN.core.ruler.after('linkify', 'forum-special-text', transformForumSpecialText)
TOPIC_MARKDOWN.disable(['autolink', 'code', 'fence', 'heading', 'image', 'link'])

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

interface ForumTopicRenderOptions {
  topicHref?: (topicId: string) => string
  documentLinks?: Readonly<Record<string, string>>
}

export function renderTiptapToHtml(doc: JSONContent, options: ForumTopicRenderOptions = {}): string {
  return renderToHTMLString({
    content: doc,
    extensions: createForumContentExtensions({ openLinks: true }),
    options: {
      markMapping: {
        link: ({ mark, children }) => {
          const content = serializeChildrenToHTMLString(children)
          const href = typeof mark.attrs.href === 'string' ? mark.attrs.href : ''
          return renderTiptapLink(href, content, options)
        },
      },
      nodeMapping: {
        emoji: ({ node }) => renderEmoji(node.attrs),
        mention: ({ node }) => renderMention(node.attrs),
        text: ({ node }) => node.marks?.some(mark => mark.type.name === 'code' || mark.type.name === 'link')
          ? escapeHtml(node.text || '')
          : linkForumReferences(node.text || '', options),
      },
    },
  })
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
  if (!isAllowedForumHref(href))
    return content

  const escapedHref = escapeHtml(href)
  const documentTitle = options.documentLinks && getForumDocumentTitle(href, options.documentLinks)
  if (documentTitle && content === escapedHref) {
    return `<a class="vp-link forum-document-link" href="${escapeAttribute(href)}" title="${escapeAttribute(href)}"><span aria-hidden="true" class="forum-document-link-icon i-lucide-file-text"></span>${escapeHtml(documentTitle)}</a>`
  }

  const isAutoLink = AUTO_LINK_PROTOCOL_REGEX.test(href) && content === escapedHref
  const label = isAutoLink ? escapeHtml(shortenForumAutoLink(href)) : content
  const className = isAutoLink ? 'vp-link forum-external-link' : 'vp-link'
  return `<a class="${className}" href="${escapeAttribute(href)}" rel="noopener noreferrer" target="_blank"${isAutoLink ? ` title="${escapeAttribute(href)}"` : ''}>${label}</a>`
}

/** 无协议链接：白名单域名（官网/Gitee/GitHub）自动补全协议，让 linkify 识别；按 URL 字符集匹配避免吞入标点/中文 */
const SCHEMELESS_URL_REGEX = new RegExp(
  `(?<![\\w.:/])(?:${FORUM_LINK_HOST_ALLOWLIST.map(domain => domain.replaceAll('.', '\\.')).join('|')})/[\\w.~:/?#@!$&*+,;=%()-]+`,
  'g',
)

/** 链接尾部常见标点（中英文、全角括号），剥离后原样保留 */
const TRAILING_URL_PUNCTUATION = /[.,;:!?，。；：！？）)\]}]+$/

function normalizeSchemelessUrls(text: string, prefix = '', suffix = ''): string {
  return text.replace(SCHEMELESS_URL_REGEX, (match, offset: number) => {
    const punct = match.match(TRAILING_URL_PUNCTUATION)?.[0] ?? ''
    const core = punct ? match.slice(0, -punct.length) : match
    if (isMarkdownUrlContext(`${prefix}${text.slice(0, offset)}`, `${punct}${text.slice(offset + match.length)}${suffix}`))
      return match
    return `https://${core}${punct}`
  })
}

function renderForumPlainText(text: string, options: ForumTopicRenderOptions): string {
  const normalizedText = normalizeSchemelessUrls(text)
  const matches = TOPIC_MARKDOWN.linkify.match(normalizedText) ?? []
  let cursor = 0
  let html = ''

  for (const match of matches) {
    html += linkForumReferences(normalizedText.slice(cursor, match.index), options)
    const before = normalizedText.slice(0, match.index)
    const after = normalizedText.slice(match.lastIndex)
    const usesMarkdownLinkSyntax = isMarkdownUrlContext(before, after)
    html += usesMarkdownLinkSyntax
      ? escapeHtml(match.raw)
      : renderTiptapLink(match.url, escapeHtml(match.raw), options)
    cursor = match.lastIndex
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

export function renderForumTopic(text: string, options: ForumTopicRenderOptions = {}): string {
  return sanitizeForumHtml(TOPIC_MARKDOWN.render(escapeTopicCodeFenceMarkers(text), options))
}

export function renderForumTopicSummary(text: string, options: ForumTopicRenderOptions = {}): string {
  return sanitizeForumHtml(TOPIC_MARKDOWN.renderInline(escapeTopicCodeFenceMarkers(text), options))
}

function escapeTopicCodeFenceMarkers(text: string): string {
  return text.replace(TOPIC_CODE_FENCE_MARKER_REGEX, (_match, indent: string, marker: string) => (
    `${indent}${Array.from(marker, character => `\\${character}`).join('')}`
  ))
}

function sanitizeForumHtml(html: string): string {
  return typeof DOMPurify.sanitize === 'function'
    ? DOMPurify.sanitize(html, FORUM_HTML_SANITIZE_CONFIG)
    : html
}

function transformForumSpecialText(state: StateCore): void {
  for (const token of state.tokens) {
    if (token.type !== 'inline' || !token.children)
      continue

    token.children = linkForumReferenceTokens(token.children, state)
    decorateAutoLinks(token.children, state)
  }
}

function normalizeSchemelessLinkTokens(state: StateCore): void {
  for (const token of state.tokens) {
    if (token.type !== 'inline' || !token.children)
      continue
    for (const [index, child] of token.children.entries()) {
      if (child.type === 'text') {
        child.content = normalizeSchemelessUrls(
          child.content,
          token.children.slice(0, index).map(item => item.content).join(''),
          token.children.slice(index + 1).map(item => item.content).join(''),
        )
      }
    }
  }
}

function linkForumReferenceTokens(tokens: Token[], state: StateCore): Token[] {
  const result: Token[] = []
  let linkDepth = 0

  for (const token of tokens) {
    if (token.type === 'link_open')
      linkDepth++

    if (token.type !== 'text' || linkDepth > 0) {
      result.push(token)
    }
    else {
      result.push(...forumReferenceTokens(token.content, state))
    }

    if (token.type === 'link_close')
      linkDepth--
  }

  return result
}

function forumReferenceTokens(text: string, state: StateCore): Token[] {
  const topicHref = (state.env as ForumTopicRenderOptions).topicHref
  const result: Token[] = []
  let cursor = 0

  for (const match of text.matchAll(FORUM_REFERENCE_REGEX)) {
    const index = match.index
    const topicId = match.groups?.topic
    const login = match.groups?.mention
    const href = topicId ? topicHref?.(topicId) : login ? getForumMentionHref(login) : undefined
    if (!href || (topicId ? !isSafeForumHref(href) : !isAllowedForumHref(href)))
      continue

    if (index > cursor)
      result.push(textToken(text.slice(cursor, index), state))

    const open = new state.Token('link_open', 'a', 1)
    open.attrSet('class', topicId ? 'vp-link forum-topic-reference' : 'mention vp-link')
    open.attrSet('href', href)
    if (login) {
      open.attrSet('rel', 'noopener noreferrer')
      open.attrSet('target', '_blank')
    }
    result.push(open, textToken(topicId ? `#${topicId}` : `@${login}`, state), new state.Token('link_close', 'a', -1))
    cursor = index + match[0].length
  }

  if (cursor < text.length)
    result.push(textToken(text.slice(cursor), state))

  return result.length ? result : [textToken(text, state)]
}

function decorateAutoLinks(tokens: Token[], state: StateCore): void {
  for (let index = 0; index < tokens.length; index++) {
    const open = tokens[index]
    if (open.type !== 'link_open')
      continue

    const href = open.attrGet('href') || ''
    const closeIndex = tokens.findIndex((token, tokenIndex) => tokenIndex > index && token.type === 'link_close')
    if (open.markup === 'linkify' && (isMarkdownLinkSyntax(tokens, index, closeIndex) || !isAllowedForumHref(href))) {
      deactivateLinkTokens(open, tokens[closeIndex])
      continue
    }
    if (closeIndex > index && decorateDocumentLink(tokens, index, closeIndex, href, state))
      continue

    if (open.markup !== 'linkify')
      continue
    if (!AUTO_LINK_PROTOCOL_REGEX.test(href))
      continue

    open.attrJoin('class', 'vp-link forum-external-link')
    open.attrSet('rel', 'noopener noreferrer')
    open.attrSet('target', '_blank')
    open.attrSet('title', href)

    const label = tokens[index + 1]
    if (label?.type === 'text')
      label.content = shortenForumAutoLink(label.content)
  }
}

function isMarkdownLinkSyntax(tokens: Token[], openIndex: number, closeIndex: number): boolean {
  if (closeIndex <= openIndex)
    return false
  const before = tokens[openIndex - 1]
  const after = tokens[closeIndex + 1]
  if (before?.type !== 'text' || after?.type !== 'text')
    return false
  return isMarkdownUrlContext(before.content, after.content)
}

function isMarkdownUrlContext(before: string, after: string): boolean {
  return (MARKDOWN_LINK_PREFIX_REGEX.test(before) && after.startsWith(')'))
    || ((before.endsWith('[') || before.endsWith('![')) && after.startsWith(']('))
    || (before.endsWith('](') && after.startsWith(')'))
    || (before.endsWith('<') && after.startsWith('>'))
}

function deactivateLinkTokens(open: Token, close: Token | undefined): void {
  open.type = 'text'
  open.tag = ''
  open.content = ''
  if (!close)
    return
  close.type = 'text'
  close.tag = ''
  close.content = ''
}

function decorateDocumentLink(
  tokens: Token[],
  openIndex: number,
  closeIndex: number,
  href: string,
  state: StateCore,
): boolean {
  const documentLinks = (state.env as ForumTopicRenderOptions).documentLinks
  const title = documentLinks && getForumDocumentTitle(href, documentLinks)
  const open = tokens[openIndex]
  const label = tokens.slice(openIndex + 1, closeIndex).map(token => token.content).join('')
  if (!title || (open.markup !== 'linkify' && label !== href))
    return false

  open.attrJoin('class', 'vp-link forum-document-link')
  open.attrSet('title', href)

  const icon = new state.Token('html_inline', '', 0)
  icon.content = '<span aria-hidden="true" class="forum-document-link-icon i-lucide-file-text"></span>'
  tokens.splice(openIndex + 1, closeIndex - openIndex - 1, icon, textToken(title, state))
  return true
}

function textToken(content: string, state: StateCore): Token {
  const token = new state.Token('text', '', 0)
  token.content = content
  return token
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
