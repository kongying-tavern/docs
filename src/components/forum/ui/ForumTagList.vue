<script setup lang="ts">
import { computed } from 'vue'

import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/composables/getTopicTagMap'

const props = defineProps<{
  data: string[]
}>()

const topicTagMap = getTopicTagMap()
const topicLabelGetter = getTopicTagLabelGetter()

const tags = computed(() =>
  props.data.filter(label => topicLabelGetter.isLabel(label)),
)
</script>

<template>
  <div v-if="tags.length > 0">
    <span
      v-for="label in tags"
      :key="label"
      class="font-size-3 color-[--vp-c-text-2] font-[var(--vp-font-family-subtitle)] mr-2 mt-2 px-2.5 rounded-full bg-[--vp-c-gray-soft] inline-flex pointer-events-auto"
    >
      #{{ topicTagMap.get(topicLabelGetter.getTag(label) ?? '') }}
    </span>
  </div>
</template>
