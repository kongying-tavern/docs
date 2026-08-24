import type { JSONContent } from '@tiptap/core'
import type { DecodedForumText } from './forumContentCodec'
import {
  renderToHTMLString,
  serializeChildrenToHTMLString,
} from '@tiptap/static-renderer/pm/html-string'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { createForumContentExtensions } from './forumTiptapExtensions'

/** Matches safe relative and supported absolute forum link targets. */
const SAFE_FORUM_URI_REGEX = /^(?!\/\/)(?:(?:https?|mailto):|\.{0,2}\/|#)/i

/** Matches an emoji filename extension. */
const EMOJI_FILE_EXTENSION_REGEX = /\.[^.]+$/

/** Matches a persisted Gitee login. */
const MENTION_LOGIN_REGEX = /^[\dA-Z][\w-]{0,63}$/i

const TOPIC_MARKDOWN = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
})

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

export type RenderedForumComment
  = | { kind: 'plain', text: string }
    | { kind: 'html', html: string, text: string }

export function renderTiptapToHtml(doc: JSONContent): string {
  return renderToHTMLString({
    content: doc,
    extensions: createForumContentExtensions({ openLinks: true }),
    options: {
      markMapping: {
        link: ({ mark, children }) => {
          const content = serializeChildrenToHTMLString(children)
          const href = typeof mark.attrs.href === 'string' ? mark.attrs.href : ''
          return isSafeForumHref(href)
            ? `<a class="vp-link" href="${escapeAttribute(href)}" rel="noopener noreferrer" target="_blank">${content}</a>`
            : content
        },
      },
      nodeMapping: {
        emoji: ({ node }) => renderEmoji(node.attrs),
        mention: ({ node }) => renderMention(node.attrs),
        text: ({ node }) => escapeHtml(node.text || ''),
      },
    },
  })
}

export function renderForumComment(content: DecodedForumText): RenderedForumComment {
  if (content.kind === 'plain')
    return content

  try {
    return {
      kind: 'html',
      html: sanitizeForumHtml(renderTiptapToHtml(content.doc)),
      text: content.text,
    }
  }
  catch {
    return { kind: 'plain', text: content.text }
  }
}

export function renderForumTopic(text: string): string {
  return sanitizeForumHtml(TOPIC_MARKDOWN.render(text))
}

export function isSafeForumHref(href: string): boolean {
  return SAFE_FORUM_URI_REGEX.test(href)
}

function sanitizeForumHtml(html: string): string {
  return typeof DOMPurify.sanitize === 'function'
    ? DOMPurify.sanitize(html, FORUM_HTML_SANITIZE_CONFIG)
    : html
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

  if (!MENTION_LOGIN_REGEX.test(label))
    return `<span class="mention">${text}</span>`

  return `<a class="mention vp-link" href="https://gitee.com/${encodeURIComponent(label)}" rel="noopener noreferrer" target="_blank">${text}</a>`
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
