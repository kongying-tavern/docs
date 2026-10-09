import type MarkdownIt from 'markdown-it'
import type { MarkdownOptions } from 'vitepress'

import comark from '@comark/markdown-it'
import { abbr } from '@mdit/plugin-abbr'
import { demo } from '@mdit/plugin-demo'
import { figure } from '@mdit/plugin-figure'
import { imgSize, obsidianImgSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import MarkdownItKbd from 'markdown-it-kbd-better'
import MarkdownItCard from '../theme/markdown/card.ts'
import MarkdownItColorPreview from '../theme/markdown/colorPreview.ts'
import { applyComarkPatches } from '../theme/markdown/comark-patches.ts'
import MarkdownItCustomColor from '../theme/markdown/customColor.ts'
import MarkdownItDocHeaderTitle from '../theme/markdown/docHeaderTitle.ts'
import MarkdownItEmoji from '../theme/markdown/emoji.ts'
import MarkdownItLightbox from '../theme/markdown/lightbox.ts'
import MarkdownItMention from '../theme/markdown/mention.ts'
import { ruby } from '../theme/markdown/ruby.ts'
import { spoiler } from '../theme/markdown/spoiler.ts'
import MarkdownItTimeline from '../theme/markdown/timeline.ts'
import MarkdownItVariableInject from '../theme/markdown/variableInject.ts'

export const markdownConfig: MarkdownOptions = {
  attrs: true,
  image: {
    lazyLoad: true,
  },
  preConfig(md) {
    // `demo` must run before Comark, otherwise `:::: demo` is parsed as
    // an MDC block component and never reaches the demo container plugin.
    md.use(demo, {
      openRender: () => {
        return '<details class="vp-container vp-md-demo">'
      },
      closeRender: () => {
        return '</details>'
      },
      contentOpenRender: () => {
        return [
          '<summary class="demo-content">',
          '<div class="vp-container-header">',
          '<button type="button" title="toggle" class="vp-md-demo-toggle-button"></button>',
          '</div>',
          '<div class="vp-md-demo-display">',
        ].join('')
      },
      contentCloseRender: () => {
        return [
          '</div>',
          '</summary>',
        ].join('')
      },
    })
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
    md.use(MarkdownItColorPreview)
    md.use(MarkdownItCard)
    md.use(sub)
    md.use(sup)
    md.use(mark)
    md.use(imgSize)
    md.use(obsidianImgSize)
    md.use(figure)
    md.use(...MarkdownItTimeline('timeline', md))
    md.use(spoiler)
    md.use(MarkdownItLightbox)
    md.use(MarkdownItVariableInject)
    md.use(MarkdownItCustomColor)
    md.use(MarkdownItMention)
    md.use(MarkdownItEmoji)
    md.use(abbr)
    md.use(ruby)
    md.use(MarkdownItDocHeaderTitle)

    // Kbd reuses `:`-adjacent syntax, so it runs after Comark.
    md.use(MarkdownItKbd, {
      presets: [
        {
          name: 'icons',
        },
      ],
    })
  },
}
