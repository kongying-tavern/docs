/**
 * Forked and modified from https://github.com/markdown-it/markdown-it-mark/blob/master/index.mjs
 */

import type { PluginWithOptions } from 'markdown-it'
import type { RuleInline } from 'markdown-it/lib/parser_inline.mjs'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type { Delimiter } from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type Token from 'markdown-it/lib/token.mjs'

export interface MarkdownItSpoilerOptions {
  /**
   * @default "span"
   */
  tag?: string

  /**
   * @default [["class", "spoiler"], ["tabindex","-1"]]
   */
  attrs?: [string, string][]
}

interface SpoilerContent {
  content: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

/**
 * Extract content from spoiler tokens
 */
function extractSpoilerContent(tokens: Token[], startIdx: number): string {
  let content = ''
  let depth = 1

  for (let i = startIdx + 1; i < tokens.length && depth > 0; i++) {
    const token = tokens[i]
    if (token.type === 'spoiler_open') {
      depth++
    }
    else if (token.type === 'spoiler_close') {
      depth--
    }
    else if (token.type === 'text' && depth === 1) {
      content += token.content
    }
  }

  return content.trim()
}

/**
 * Parse attributes from content like "text{width=200,align=center}" or "text{w=150px,a=right}"
 */
function extractAttributesFromContent(content: string): SpoilerContent {
  // Match pattern: text{width=200,align=center} or text{w=150,a=right}
  const match = content.match(/^([^{]*)\{([^}]+)\}$/)
  if (!match)
    return { content }

  const cleanContent = match[1].trim()
  const attributesStr = match[2]
  const result: SpoilerContent = { content: cleanContent }

  // Parse multiple attributes
  const attributes = attributesStr.split(',').map(attr => attr.trim())

  for (const attr of attributes) {
    const [key, value] = attr.split('=').map(s => s.trim())

    if (key === 'width' || key === 'w') {
      const width = Number.parseInt(value.replace('px', ''))
      if (width >= 50 && width <= 800) {
        result.width = width
      }
    }

    if (key === 'align' || key === 'a') {
      if (['left', 'center', 'right'].includes(value)) {
        result.align = value as 'left' | 'center' | 'right'
      }
    }
  }

  return result
}

/**
 * Calculate optimal width based on content
 */
function calculateWidth(content: string): number {
  // Count Chinese characters (wider) and other characters
  const chineseChars = (content.match(/[\u4E00-\u9FA5]/g) || []).length
  const otherChars = content.length - chineseChars

  // More accurate character width calculation
  const estimatedWidth = (chineseChars * 16) + (otherChars * 9)

  // Adaptive boundaries
  const minWidth = Math.max(60, content.length * 6) // Adaptive minimum
  const maxWidth = 500 // Increased maximum for longer content
  const padding = 30 // Reduced padding for better text fit

  return Math.max(minWidth, Math.min(estimatedWidth + padding, maxWidth))
}

/*
 * Insert each marker as a separate text token, and add it to delimiter list
 *
 */
const tokenize: RuleInline = (state, silent) => {
  const start = state.pos
  const marker = state.src.charCodeAt(start)

  if (silent || marker !== 33 /* ! */)
    return false

  const scanned = state.scanDelims(state.pos, true)
  let { length } = scanned

  if (length < 2)
    return false

  const markerChar = String.fromCharCode(marker)

  if (length % 2) {
    const token = state.push('text', '', 0)

    token.content = markerChar
    length--
  }

  for (let i = 0; i < length; i += 2) {
    const token = state.push('text', '', 0)

    token.content = markerChar + markerChar

    if (scanned.can_open || scanned.can_close) {
      state.delimiters.push({
        marker: 0x21,
        length: 0, // disable "rule of 3" length checks meant for emphasis
        token: state.tokens.length - 1,
        end: -1,
        open: scanned.can_open,
        close: scanned.can_close,
      })
    }
  }

  state.pos += scanned.length

  return true
}

/*
 * Walk through delimiter list and replace text tokens with tags
 *
 */
function postProcess(state: StateInline, delimiters: Delimiter[], { tag, attrs }: Required<MarkdownItSpoilerOptions>): void {
  let token
  const loneMarkers = []
  const max = delimiters.length

  for (let i = 0; i < max; i++) {
    const startDelim = delimiters[i]

    if (startDelim.marker === 0x21 /* ! */ && startDelim.end !== -1) {
      const endDelim = delimiters[startDelim.end]

      token = state.tokens[startDelim.token]
      token.type = 'spoiler_open'
      token.tag = tag
      token.nesting = 1
      token.markup = '!!'
      token.attrs = attrs
      token.content = ''

      token = state.tokens[endDelim.token]
      token.type = 'spoiler_close'
      token.tag = tag
      token.nesting = -1
      token.markup = '!!'
      token.content = ''

      if (
        state.tokens[endDelim.token - 1].type === 'text'
        && state.tokens[endDelim.token - 1].content === '!'
      ) {
        loneMarkers.push(endDelim.token - 1)
      }
    }
  }

  /*
   * If a marker sequence has an odd number of characters, it’s splitted
   * like this: `~~~~~` -> `~` + `~~` + `~~`, leaving one marker at the
   * start of the sequence.
   *
   * So, we have to move all those markers after subsequent s_close tags.
   *
   */
  while (loneMarkers.length) {
    const i = loneMarkers.pop()!
    let j = i + 1

    while (j < state.tokens.length && state.tokens[j].type === 'spoiler_close')
      j++

    j--

    if (i !== j) {
      token = state.tokens[j]
      state.tokens[j] = state.tokens[i]
      state.tokens[i] = token
    }
  }
}

export const spoiler: PluginWithOptions<MarkdownItSpoilerOptions> = (
  md,
  {
    tag = '', // Use empty tag for custom rendering
    attrs = [],
  }: MarkdownItSpoilerOptions = {},
) => {
  md.inline.ruler.before('emphasis', 'spoiler', tokenize)
  md.inline.ruler2.before('emphasis', 'spoiler', (state) => {
    postProcess(state, state.delimiters, { tag, attrs })

    for (const tokenMeta of state.tokens_meta) {
      if (tokenMeta?.delimiters)
        postProcess(state, tokenMeta.delimiters, { tag, attrs })
    }

    return true
  })

  // Custom rendering rules for ScratchToReveal component
  md.renderer.rules.spoiler_open = (tokens, idx) => {
    const content = extractSpoilerContent(tokens, idx)
    const { content: cleanContent, width: customWidth, align } = extractAttributesFromContent(content)

    const finalWidth = customWidth || calculateWidth(cleanContent)
    const alignStyle = align ? ` style="text-align: ${align};"` : ''

    return `<ScratchToReveal :width="${finalWidth}" :height="32" spoiler class="inline-spoiler"${alignStyle}>`
  }

  md.renderer.rules.spoiler_close = () => {
    return '</ScratchToReveal>'
  }
}
