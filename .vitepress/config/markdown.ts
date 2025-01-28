import { cardPlugin } from '../theme/markdown/card'
import { colorPreviewPlugin } from '../theme/markdown/colorPreview'
import { timeline } from '../theme/markdown/timeline'
import { figure } from '@mdit/plugin-figure'
import { imgSize, obsidianImageSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { spoiler } from '@mdit/plugin-spoiler'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'

import variableInject from '../theme/markdown/variableInject'
import customColor from '../theme/markdown/customColor'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItKbd from 'markdown-it-kbd-better'
import lightbox from '../theme/markdown/lightbox'

import type { MarkdownOptions } from 'vitepress'

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
    md.use(MarkdownItKbd, {
      presets: [
        {
          name: 'icons',
        },
      ],
    })
  },
}
