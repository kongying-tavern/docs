<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'

const { type, iconOnly = false } = defineProps<{
  type: ForumAPI.TopicType
  iconOnly?: boolean
}>()

const topicTypeMap = getTopicTypeMap()

const typeColorClass: Record<ForumAPI.TopicKind, string> = {
  BUG: 'bg-[var(--forum-topic-type-bug)]',
  FEAT: 'bg-[var(--forum-topic-type-feat)]',
  ANN: 'bg-[var(--forum-topic-type-ann)]',
  POST: 'bg-[var(--forum-topic-type-post)]',
}
</script>

<template>
  <span
    v-if="type"
    class="font-size-xs flex items-center"
    :aria-label="iconOnly ? topicTypeMap.get(type) : undefined"
    :title="iconOnly ? topicTypeMap.get(type) : undefined"
  >
    <span class="size-12px inline-block" :class="[typeColorClass[type], { 'mr-1': !iconOnly }]" />
    <template v-if="!iconOnly">
      {{ topicTypeMap.get(type) }}
    </template>
  </span>
</template>
