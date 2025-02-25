<script setup lang="ts">
import { cardPlugin } from '@/markdown/card'
import { colorPreviewPlugin } from '@/markdown/colorPreview'
import customColor from '@/markdown/customColor'
import lightbox from '@/markdown/lightbox'
import { timeline } from '@/markdown/timeline'
import variableInject from '@/markdown/variableInject'
import { figure } from '@mdit/plugin-figure'
import { imgSize, obsidianImageSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { spoiler } from '@mdit/plugin-spoiler'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import MarkdownIt from 'markdown-it'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItKbd from 'markdown-it-kbd-better'
import { computed, withDefaults } from 'vue'

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

<template>
  <div class="flex items-start gap-3" :style="{ height }">
    <textarea v-model="modelValue" class="h-full flex-1 p-2" />
    <div class="h-full flex-1 overflow-y-auto" v-html="rendered" />
  </div>
</template>
