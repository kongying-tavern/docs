<script setup lang="ts">
import type { SpringParams } from 'torph'
import type { HTMLAttributes } from 'vue'
import { TextMorph as TorphTextMorph } from 'torph/vue'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

// torph 文本形变的统一封装：locale 缺省跟随站点语言，其余参数与 torph 保持一致
const props = withDefaults(defineProps<{
  text: string
  as?: string
  class?: HTMLAttributes['class']
  /** 数字与标点格式化所用 locale，缺省跟随站点语言 */
  locale?: string
  duration?: number
  ease?: string | SpringParams
  scale?: boolean
  /** 数字按位形变；关闭则回退逐字符形变 */
  numbers?: boolean
  disabled?: boolean
  respectReducedMotion?: boolean
}>(), {
  as: 'span',
  class: undefined,
  locale: undefined,
  duration: 400,
  ease: 'cubic-bezier(0.19, 1, 0.22, 1)',
  scale: true,
  numbers: true,
  disabled: false,
  respectReducedMotion: true,
})

const { lang } = useData()
const resolvedLocale = computed(() => props.locale ?? lang.value)
</script>

<template>
  <TorphTextMorph
    :as="props.as"
    :class="cn(props.class)"
    :disabled="props.disabled"
    :duration="props.duration"
    :ease="props.ease"
    :locale="resolvedLocale"
    :numbers="props.numbers"
    :respect-reduced-motion="props.respectReducedMotion"
    :scale="props.scale"
    :text="props.text"
  />
</template>
