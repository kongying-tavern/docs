<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import Time from '@/components/ui/time/Time.vue'

const { date = new Date(), relative = true } = defineProps<{
  date?: string | number | Date
  format?: string
  relative?: boolean
}>()

const { lang } = useData()

// 浏览器本地语言；SSR 阶段不可用时回退站点 locale
const browserLocale = import.meta.env.SSR ? '' : navigator.language

const absoluteText = computed(() => {
  const locale = browserLocale || lang.value || 'zh-CN'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(date))
})
</script>

<template>
  <Time
    :datetime="date"
    :locale="lang"
    :relative="relative"
    :title="relative ? absoluteText : undefined"
    class="cursor-default"
  />
</template>
