import type { MarkdownOptions } from 'vitepress'

import { demo } from '@mdit/plugin-demo'
import { figure } from '@mdit/plugin-figure'
import { imgSize, obsidianImageSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { spoiler } from '@mdit/plugin-spoiler'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'

import markdownItAttrs from 'markdown-it-attrs'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItKbd from 'markdown-it-kbd-better'
import MarkdownItCard from '../theme/markdown/card'
import MarkdownItColorPreview from '../theme/markdown/colorPreview'
import MarkdownItCustomColor from '../theme/markdown/customColor'
import MarkdownItEmoji from '../theme/markdown/emoji'
import MarkdownItLightbox from '../theme/markdown/lightbox'
import MarkdownItMention from '../theme/markdown/mention'
import MarkdownItTimeline from '../theme/markdown/timeline'
import MarkdownItVariableInject from '../theme/markdown/variableInject'

export const markdownConfig: MarkdownOptions = {
  image: {
    lazyLoading: true,
  },
  config(md) {
    md.use(MarkdownItFootnote)
    md.use(MarkdownItColorPreview)
    md.use(MarkdownItCard)
    md.use(sub)
    md.use(sup)
    md.use(mark)
    md.use(imgSize)
    md.use(obsidianImageSize)
    md.use(figure)
    md.use(...MarkdownItTimeline('timeline', md))
    md.use(spoiler)
    md.use(MarkdownItLightbox)
    md.use(MarkdownItVariableInject)
    md.use(MarkdownItCustomColor)
    md.use(MarkdownItMention)
    md.use(MarkdownItEmoji)
    md.use(markdownItAttrs, {
      allowedAttributes: ['id', 'class', 'thumbhash', 'width', 'height', /^regex.*$/],
    })
    md.use(MarkdownItKbd, {
      presets: [
        {
          name: 'icons',
        },
      ],
    })
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
  },
}
