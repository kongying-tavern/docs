import type { JSONContent } from '@tiptap/core'
import type Token from 'markdown-it/lib/token.mjs'
import MarkdownIt from 'markdown-it'
import { decodeForumText } from './forumContentCodec'

const JSON_LIKE_TEXT_REGEX = /^\s*[[{]/u
const LEGACY_IMAGE_REGEX = /!\[[^\]]*\]\([^)]*\)/gu
const LEGACY_BLOCK_MARKER_REGEX = /^( {0,3})(`{3,}|~{3,}|#{1,6})(?=\s|\w|$)/gm

// Only legacy persisted text is parsed as Markdown. New editors persist JSON.
const legacyParser = new MarkdownIt({ html: false }).disable(['link', 'autolink', 'image', 'table', 'entity'])

// 旧正文只支持段落、列表、引用和行内格式；直接构造 JSON，不实例化编辑器扩展。
function parseLegacyTokens(tokens: Token[]): JSONContent[] {
  const result: JSONContent[] = []
  const stack = [result]
  const marks: NonNullable<JSONContent['marks']> = []
  const blocks: Record<string, string> = {
    paragraph_open: 'paragraph',
    heading_open: 'heading',
    blockquote_open: 'blockquote',
    bullet_list_open: 'bulletList',
    ordered_list_open: 'orderedList',
    list_item_open: 'listItem',
  }
  const markTypes: Record<string, string> = { strong: 'bold', em: 'italic', s: 'strike' }
  for (const token of tokens) {
    const content = stack.at(-1)!
    const markType = markTypes[token.tag]
    if (markType && token.nesting) {
      if (token.nesting === 1)
        marks.push({ type: markType })
      else
        marks.pop()
    }
    else if (blocks[token.type]) {
      const node: JSONContent = { type: blocks[token.type], content: [] }
      if (token.type === 'ordered_list_open')
        node.attrs = { start: Number(token.attrGet('start') ?? 1) }
      if (token.type === 'heading_open')
        node.attrs = { level: Number(token.tag.slice(1)) }
      content.push(node)
      stack.push(node.content!)
    }
    else if (token.nesting === -1) {
      stack.pop()
    }
    else if (token.type === 'inline') {
      content.push(...parseLegacyTokens(token.children ?? []))
    }
    else if (token.type === 'hr') {
      content.push({ type: 'horizontalRule' })
    }
    else if (token.type === 'hardbreak') {
      content.push({ type: 'hardBreak' })
    }
    else if (token.type !== 'code_block') {
      const text = token.type === 'softbreak' ? '\n' : token.content
      if (text) {
        const textMarks = (token.type === 'code_inline' ? [...marks, { type: 'code' }] : [...marks]).reverse()
        const previous = content.at(-1)
        if (previous?.type === 'text' && JSON.stringify(previous.marks ?? []) === JSON.stringify(textMarks))
          previous.text = (previous.text ?? '') + text
        else
          content.push({ type: 'text', text, ...(textMarks.length ? { marks: textMarks } : {}) })
      }
    }
  }
  return result
}

export function forumTextToEditorDoc(text: string): JSONContent {
  const decoded = decodeForumText(text)
  if (decoded.kind === 'tiptap')
    return decoded.doc
  if (!text || JSON_LIKE_TEXT_REGEX.test(text)) {
    return { type: 'doc', content: [{ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) }] }
  }
  const literals: string[] = []
  let prefix = 'FORUMLEGACYLITERAL'
  while (text.includes(prefix))
    prefix += 'X'
  const literalRegex = new RegExp(`${prefix}(\\d+)END`, 'gu')
  const protect = (value: string) => {
    literals.push(value)
    return `${prefix}${literals.length - 1}END`
  }
  const doc: JSONContent = { type: 'doc', content: parseLegacyTokens(legacyParser.parse(text
    .replace(LEGACY_IMAGE_REGEX, protect)
    .replace(LEGACY_BLOCK_MARKER_REGEX, (_match, indent: string, marker: string) => `${indent}${protect(marker)}`), {})) }
  const restore = (node: JSONContent): void => {
    if (node.text)
      node.text = node.text.replace(literalRegex, (_match, index: string) => literals[Number(index)]!)
    node.content?.forEach(restore)
  }
  restore(doc)
  return doc
}
