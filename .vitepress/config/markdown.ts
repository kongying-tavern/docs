import type MarkdownIt from 'markdown-it'
import type { MarkdownOptions } from 'vitepress'

import comark from '@comark/markdown-it'
import { abbr } from '@mdit/plugin-abbr'
import { figure } from '@mdit/plugin-figure'
import { imgSize, obsidianImgSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import { MarkdownExtCard } from '../theme/markdown-ext/card/index.ts'
import { MarkdownExtColorPreview } from '../theme/markdown-ext/color-preview/index.ts'
import { applyComarkPatches } from '../theme/markdown-ext/comark/index.ts'
import { MarkdownExtCustomColor } from '../theme/markdown-ext/custom-color/index.ts'
import { MarkdownExtDemo } from '../theme/markdown-ext/demo/index.ts'
import { MarkdownExtDocHeaderTitle } from '../theme/markdown-ext/doc-header-title/index.ts'
import { MarkdownExtEmoji } from '../theme/markdown-ext/emoji/index.ts'
import { MarkdownExtKbd } from '../theme/markdown-ext/kbd/index.ts'
import { MarkdownExtLightbox } from '../theme/markdown-ext/lightbox/index.ts'
import { MarkdownExtMention } from '../theme/markdown-ext/mention/index.ts'
import { MarkdownExtQA } from '../theme/markdown-ext/qa/index.ts'
import { MarkdownExtRuby } from '../theme/markdown-ext/ruby/index.ts'
import { MarkdownExtSpoiler } from '../theme/markdown-ext/spoiler/index.ts'
import { MarkdownExtTimeline } from '../theme/markdown-ext/timeline/index.ts'
import { MarkdownExtVariableInject } from '../theme/markdown-ext/variable-inject/index.ts'

export const markdownConfig: MarkdownOptions = {
  attrs: true,
  image: {
    lazyLoad: true,
  },
  preConfig(md) {
    // demo must stay before Comark, otherwise `:::: demo` is parsed as
    // an MDC block component and never reaches the demo container plugin.
    md.use(MarkdownExtDemo)
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
    md.use(MarkdownExtCard)
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
