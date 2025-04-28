import type MarkdownIt from 'markdown-it'
import type { Options, PluginSimple } from 'markdown-it'

import type Renderer from 'markdown-it/lib/renderer.mjs'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import type Token from 'markdown-it/lib/token.mjs'

/**
 * VitePress plugin to add `medium-zoom` lightbox to images.
 * @param {MarkdownIt} md - Markdown instance.
 */
const MarkdownItLightbox: PluginSimple = (md: MarkdownIt) => {
  const imageRule = md.renderer.rules.image as RenderRule

  // Customize the image renderer.
  md.renderer.rules.image = (
    tokens: Token[],
    idx: number,
    options: Options,
    env: Record<string, unknown>,
    self: Renderer,
  ) => {
    const token = tokens[idx]

    token.attrSet('data-zoomable', 'true')

    return imageRule(tokens, idx, options, env, self)
  }
}

export default MarkdownItLightbox
