<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import ForumTopicLifecycle from './ForumTopicLifecycle.vue'
import ForumTopicTypeBadge from './ForumTopicTypeBadge.vue'

const { type, state, status, topicId, goodIssue = false, iconOnly = false, interactive = false } = defineProps<{
  type: ForumAPI.TopicType
  state?: ForumAPI.TopicState
  status?: ForumAPI.TopicStatus
  topicId?: string | number
  goodIssue?: boolean
  iconOnly?: boolean
  interactive?: boolean
}>()
const emit = defineEmits<{ filterType: [type: 'bug' | 'feat'], filterStatus: [status: ForumAPI.TopicStatus | 'good-issue'] }>()
</script>

<template>
  <span class="forum-topic-metadata" :class="{ 'is-icon-only': iconOnly }" :data-feedback-topic="topicId" :data-feedback-type="type" :data-feedback-status="status ?? ''" :data-feedback-good-issue="goodIssue">
    <ForumTopicLifecycle v-if="state && (type === 'BUG' || type === 'FEAT')" :state="state" :topic-id="topicId" :icon-only="iconOnly" :copyable="interactive" />
    <slot name="type">
      <ForumTopicTypeBadge class="forum-topic-classification" :type="type" :status="status" :good-issue="goodIssue" :icon-only="iconOnly" :interactive="interactive" @filter-type="emit('filterType', $event)" @filter-status="emit('filterStatus', $event)">
        <template v-if="$slots.status" #status>
          <slot name="status" />
        </template>
      </ForumTopicTypeBadge>
    </slot>
  </span>
</template>

<style scoped>
.forum-topic-metadata {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
}

.is-icon-only {
  flex-wrap: nowrap;
  gap: 0.375rem;
}

.forum-topic-classification:hover :deep(.forum-topic-property-chevron),
.forum-topic-classification:focus-within :deep(.forum-topic-property-chevron) {
  opacity: 1;
}
</style>
