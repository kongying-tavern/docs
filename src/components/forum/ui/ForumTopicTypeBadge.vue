<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'

const { type, iconOnly = false } = defineProps<{
  type: ForumAPI.TopicType
  iconOnly?: boolean
}>()

const { message } = useLocalized()

const topicTypeMap = computed(() => new Map<ForumAPI.TopicKind, string>([
  ['FEAT', message.value.forum.topic.type.feat],
  ['ANN', message.value.forum.topic.type.ann],
  ['BUG', message.value.forum.topic.type.bug],
  ['POST', message.value.forum.labels.teamBlog],
]))

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
