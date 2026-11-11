import type { PluginSimple } from 'markdown-it'
import Token from 'markdown-it/lib/token.mjs'

/*
 * Delimiter handling adapted from markdown-it-kbd-better.
 * Copyright (c) 2023 uncenter
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** Parse before inline tokenization, which would discard separator escapes. */
function parseSequence(source: string): string[][] | null {
  const sequence: string[][] = [[]]
  let key = ''
  const pushKey = () => {
    if (!key.trim())
      return false
    sequence.at(-1)!.push(key.trim())
    key = ''
    return true
  }

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (char === '\\' && /[\\+,[\]]/.test(source[i + 1] ?? '')) {
      key += source[++i]
    }
    else if (char === '+' || char === ',') {
      if (!pushKey())
        return null
      if (char === ',')
        sequence.push([])
    }
    else {
      key += char
    }
  }

  return pushKey() ? sequence : null
}

const kbd: PluginSimple = (md) => {
  md.inline.ruler.before('link', 'kbd', (state, silent) => {
    const start = state.pos
    // Link-label probing must balance brackets rather than treat shortcuts as links.
    if (silent || !state.src.startsWith('[[', start))
      return false

    // Delimiter nesting/escaping follows markdown-it-kbd-better (MIT),
    // https://github.com/uncenter/markdown-it-kbd-better/blob/main/src/index.ts.
    let depth = 1
    let end = start + 2
    for (; end < state.posMax; end++) {
      const char = state.src[end]
      if (char === '\n' || char === '\r')
        return false
      if (char === '\\') {
        end++
      }
      else if (state.src.startsWith('[[', end)) {
        depth++
        end++
      }
      else if (state.src.startsWith(']]', end)) {
        if (--depth === 0)
          break
        end++
      }
    }
    if (depth !== 0)
      return false

    const sequence = parseSequence(state.src.slice(start + 2, end))
    if (!sequence)
      return false

    let next = end + 2
    const attributes = /^\{([^{}\r\n]*)\}/.exec(state.src.slice(next))
    const platform = attributes && /^\s*platform\s*=\s*["']?(auto|mac|windows|linux)["']?\s*$/.exec(attributes[1])
    // Consume unsupported attrs too, before the general attrs plugin can bind
    // them to an enclosing paragraph. Shortcut syntax only accepts platform.
    if (attributes)
      next += attributes[0].length

    // Verbatim tokens retain key names for headings without running text transforms.
    const token = state.push('code_inline', 'KeyboardShortcut', 0)
    token.content = sequence.map(keys => keys.join('+')).join(', ')
    token.meta = { kbdSequence: sequence }
    if (platform)
      token.attrSet('platform', platform[1])
    state.pos = next
    return true
  })

  const renderCode = md.renderer.rules.code_inline!
  md.renderer.rules.code_inline = (tokens, index, options, env, self) => {
    const token = tokens[index]
    if (!token.meta?.kbdSequence)
      return renderCode(tokens, index, options, env, self)
    const sequence = md.utils.escapeHtml(JSON.stringify(token.meta.kbdSequence))
    const platform = token.attrGet('platform')
    const platformAttr = platform && ['auto', 'mac', 'windows', 'linux'].includes(platform)
      ? ` platform="${platform}"`
      : ''
    // Only data is bound: key names must never become HTML or Vue expressions.
    return `<KeyboardShortcut :sequence="${sequence}"${platformAttr}></KeyboardShortcut>`
  }

  // Markdown-it's image-alt extractor skips code tokens; expose only shortcut text.
  const renderInlineAsText = md.renderer.renderInlineAsText
  md.renderer.renderInlineAsText = (tokens, options, env) => renderInlineAsText.call(md.renderer, tokens.map((token) => {
    if (!token.meta?.kbdSequence)
      return token
    const text = new Token('text', '', 0)
    text.content = token.content
    return text
  }), options, env)

  // TOC link text enters a Vue template; encode shortcut braces without changing slugs.
  const renderToc = md.renderer.rules.toc_body
  if (renderToc) {
    md.renderer.rules.toc_body = (tokens, index, options, env, self) => renderToc(tokens.map((token) => {
      if (!token.children?.some(child => child.meta?.kbdSequence))
        return token
      const children = token.children.map((child) => {
        if (!child.meta?.kbdSequence)
          return child
        const content = child.content.replaceAll('{', '&#123;').replaceAll('}', '&#125;')
        return Object.assign(new Token(child.type, child.tag, child.nesting), child, { content })
      })
      return Object.assign(new Token(token.type, token.tag, token.nesting), token, { children })
    }), index, options, env, self)
  }
}

export default kbd
