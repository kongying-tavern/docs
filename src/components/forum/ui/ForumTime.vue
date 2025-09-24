<script setup lang="ts">
import Time from '@/components/ui/Time/Time.vue'
import { useData } from 'vitepress'

const { date = new Date(), relative = true } = defineProps<{
  date?: string | number | Date
  format?: string
  relative?: boolean
}>()

const { lang } = useData()
</script>

<template>
  <Time
    :datetime="date"
    :locale="lang"
    :relative="relative"
    title
  />
</template>
