<script setup lang="ts">
import { computed } from 'vue'
import { getTopicTagMap } from '~/composables/getTopicTagMap'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'

const props = defineProps<{
  data: string[]
}>()

const topicTagMap = getTopicTagMap()
const topicLabelGetter = getTopicTagLabelGetter()

const tags = computed(() =>
  props.data.filter((label) => topicLabelGetter.isLabel(label)),
)
</script>

<template>
  <div v-if="tags.length > 0">
    <span
      v-for="label in tags"
      :key="label"
      class="px-2.5 mt-2 font-size-3 inline-flex pointer-events-auto bg-[--vp-c-bg-soft] mr-2 rounded-full color-[--vp-c-text-2] font-[var(--vp-font-family-subtitle)]"
    >
      #{{ topicTagMap.get(topicLabelGetter.getTag(label) ?? '') }}
    </span>
  </div>
</template>
