import type { JSONContent } from '@tiptap/core'
import { resolveExtensions } from '@tiptap/core'
import { MarkdownManager } from '@tiptap/markdown'
import { decodeForumText } from './forumContentCodec'
import { isAllowedForumHref } from './forumLinkPolicy'
import { createForumTopicEditorExtensions } from './forumTiptapExtensions'

const JSON_LIKE_TEXT_REGEX = /^\s*[[{]/u
const LEGACY_IMAGE_REGEX = /!\[[^\]]*\]\([^)]*\)/gu
const LEGACY_BLOCK_MARKER_REGEX = /^( {0,3})(`{3,}|~{3,}|#{1,6})(?=\s|\w|$)/gm

// Only legacy persisted text is parsed as Markdown. New editors persist JSON.
let legacyParser: MarkdownManager | undefined

export function forumTextToEditorDoc(text: string): JSONContent {
  const decoded = decodeForumText(text)
  if (decoded.kind === 'tiptap')
    return decoded.doc
  if (!text || JSON_LIKE_TEXT_REGEX.test(text)) {
    return { type: 'doc', content: [{ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) }] }
  }
  legacyParser ??= new MarkdownManager({
    extensions: resolveExtensions(createForumTopicEditorExtensions()).map(extension => extension.name === 'link'
      ? extension.extend({
          parseMarkdown: (token, helpers) => token.raw === token.href && isAllowedForumHref(token.href)
            ? helpers.applyMark('link', helpers.parseInline(token.tokens || []), { href: token.href })
            : helpers.createTextNode(token.raw || token.text || ''),
        })
      : extension),
  })
  const literals: string[] = []
  let prefix = 'FORUMLEGACYLITERAL'
  while (text.includes(prefix))
    prefix += 'X'
  const literalRegex = new RegExp(`${prefix}(\\d+)END`, 'gu')
  const protect = (value: string) => {
    literals.push(value)
    return `${prefix}${literals.length - 1}END`
  }
  const doc = legacyParser.parse(text
    .replace(LEGACY_IMAGE_REGEX, protect)
    .replace(LEGACY_BLOCK_MARKER_REGEX, (_match, indent: string, marker: string) => `${indent}${protect(marker)}`))
  const restore = (node: JSONContent): void => {
    if (node.text)
      node.text = node.text.replace(literalRegex, (_match, index: string) => literals[Number(index)]!)
    node.content?.forEach(restore)
  }
  restore(doc)
  return doc
}
