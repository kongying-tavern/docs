<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'

const { date = new Date(), format = undefined } = defineProps<{
  date?: string | number
  format?: string
}>()
const { formatDate } = useLocalized()

const dateStr = formatDate(date, format)
</script>

<template>
  <time :datetime="dateStr">
    {{ dateStr }}
  </time>
</template>
