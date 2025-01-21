<script setup lang="ts">
import { getTopicTagMap } from '~/composables/getTopicTagMap'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'

defineProps<{
  data: string[]
}>()

const topicTagMap = getTopicTagMap()
const topicLabelGetter = getTopicTagLabelGetter()
</script>

<template>
  <div v-if="data.length > 0">
    <span
      v-for="label in data"
      :key="label"
      class="px-2.5 mt-2 font-size-3 inline-flex pointer-events-auto bg-[--vp-c-bg-soft] mr-2 rounded-full color-[--vp-c-text-2]"
    >
      #{{ topicTagMap.get(topicLabelGetter.getTag(label) ?? '') }}
    </span>
  </div>
</template>
