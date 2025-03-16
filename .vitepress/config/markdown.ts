import type { MarkdownOptions } from 'vitepress'
import { figure } from '@mdit/plugin-figure'

import { imgSize, obsidianImageSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { spoiler } from '@mdit/plugin-spoiler'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'

import markdownItAttrs from 'markdown-it-attrs'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItKbd from 'markdown-it-kbd-better'
import { cardPlugin } from '../theme/markdown/card'
import { colorPreviewPlugin } from '../theme/markdown/colorPreview'
import customColor from '../theme/markdown/customColor'
import lightbox from '../theme/markdown/lightbox'
import { timeline } from '../theme/markdown/timeline'
import variableInject from '../theme/markdown/variableInject'

export const markdownConfig: MarkdownOptions = {
  image: {
    lazyLoading: true,
  },
  config(md) {
    md.use(MarkdownItFootnote)
    md.use(colorPreviewPlugin)
    md.use(cardPlugin)
    md.use(sub)
    md.use(sup)
    md.use(mark)
    md.use(imgSize)
    md.use(obsidianImageSize)
    md.use(figure)
    md.use(timeline)
    md.use(spoiler)
    md.use(lightbox)
    md.use(variableInject)
    md.use(customColor)
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
  },
}
