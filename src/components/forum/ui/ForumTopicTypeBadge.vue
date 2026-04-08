<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'

const { type } = defineProps<{
  type: ForumAPI.TopicType
}>()

const topicTypeMap = getTopicTypeMap()

function color() {
  switch (type) {
    case 'BUG':
      return '#FFD500'
    case 'FEAT':
      return '#2ea84a'
    case 'ANN':
      return '#0088CC'
    case 'POST':
      return '#8e5cd9'
  }
}
</script>

<template>
  <span v-if="type" class="font-size-xs flex items-center">
    <span class="mr-1 size-12px inline-block" :style="{ 'background-color': color() }" />
    {{ topicTypeMap.get(type) }}
  </span>
</template>
