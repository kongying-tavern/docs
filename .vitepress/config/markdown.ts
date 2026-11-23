import type MarkdownIt from 'markdown-it'
import type { MarkdownOptions } from 'vitepress'

import comark from '@comark/markdown-it'
import { abbr } from '@mdit/plugin-abbr'
import { figure } from '@mdit/plugin-figure'
import { imgSize, obsidianImgSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import {
  applyComarkPatches,
  MarkdownExtColorPreview,
  MarkdownExtCustomColor,
  MarkdownExtDemo,
  MarkdownExtDocHeaderTitle,
  MarkdownExtEmoji,
  MarkdownExtKbd,
  MarkdownExtLightbox,
  MarkdownExtMention,
  MarkdownExtQA,
  MarkdownExtRuby,
  MarkdownExtSpoiler,
  MarkdownExtTimeline,
  MarkdownExtVariableInject,
} from '../theme/markdown-ext/index.ts'

export const markdownConfig: MarkdownOptions = {
  attrs: true,
  image: {
    lazyLoad: true,
  },
  preConfig(md) {
    md.use(comark, {
      syntax: {
        inlineProps: false,
        inlineSpan: false,
      },
    })
    // VitePress 2 passes MarkdownItAsync, which extends MarkdownIt.
    applyComarkPatches(md as unknown as MarkdownIt)
  },
  config(md) {
    md.use(MarkdownExtColorPreview)
    md.use(MarkdownExtDemo)
    md.use(MarkdownExtQA)
    md.use(sub)
    md.use(sup)
    md.use(mark)
    md.use(imgSize)
    md.use(obsidianImgSize)
    md.use(figure)
    md.use(MarkdownExtTimeline)
    md.use(MarkdownExtSpoiler)
    md.use(MarkdownExtLightbox)
    md.use(MarkdownExtVariableInject)
    md.use(MarkdownExtCustomColor)
    md.use(MarkdownExtMention)
    md.use(MarkdownExtEmoji)
    md.use(abbr)
    md.use(MarkdownExtRuby)
    md.use(MarkdownExtDocHeaderTitle)

    // Kbd reuses `:`-adjacent syntax, so it runs after Comark.
    md.use(MarkdownExtKbd)
  },
}
