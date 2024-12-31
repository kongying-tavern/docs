<script setup lang="ts">
import { getTopicTagMap } from '../../composables/getTopicTagMap'

defineProps<{
  data: string[]
}>()

const topicTagMap = getTopicTagMap()
</script>

<template>
  <div v-if="data.length > 0">
    <span
      v-for="tag in data"
      :key="tag"
      class="px-2.5 font-size-3 inline-flex pointer-events-auto bg-[--vp-c-bg-soft] mr-2 rounded-full color-[--vp-c-text-2]"
      >#{{ topicTagMap.get(tag) }}</span
    >
  </div>
</template>
