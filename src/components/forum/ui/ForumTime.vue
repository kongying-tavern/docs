<script setup lang="ts">
import { useData } from 'vitepress'
import Time from '@/components/ui/time/Time.vue'

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
