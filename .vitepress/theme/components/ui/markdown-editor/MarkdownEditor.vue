<template>
  <div class="flex gap-3 items-start" :style="{ height }">
    <textarea class="flex-1 p-2 h-full" v-model="modelValue"></textarea>
    <div class="flex-1 overflow-y-auto h-full" v-html="rendered"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults } from 'vue'
import MarkdownIt from 'markdown-it'

import { figure } from '@mdit/plugin-figure'
import { imgSize, obsidianImageSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { spoiler } from '@mdit/plugin-spoiler'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItKbd from 'markdown-it-kbd-better'
import lightbox from '@/markdown/lightbox'

import { cardPlugin } from '@/markdown/card'
import { colorPreviewPlugin } from '@/markdown/colorPreview'
import { timeline } from '@/markdown/timeline'
import variableInject from '@/markdown/variableInject'
import customColor from '@/markdown/customColor'

withDefaults(
  defineProps<{
    height?: string | number
  }>(),
  {
    height: '10rem',
  },
)

const modelValue = defineModel<string>('modelValue', { default: '' })

const rendered = computed(() => {
  return MarkdownIt()
    .use(MarkdownItFootnote)
    .use(colorPreviewPlugin)
    .use(cardPlugin)
    .use(sub)
    .use(sup)
    .use(mark)
    .use(imgSize)
    .use(obsidianImageSize)
    .use(figure)
    .use(timeline)
    .use(spoiler)
    .use(lightbox)
    .use(variableInject)
    .use(customColor)
    .use(MarkdownItKbd, {
      presets: [
        {
          name: 'icons',
        },
      ],
    })
    .render(modelValue.value ?? '')
})
</script>
