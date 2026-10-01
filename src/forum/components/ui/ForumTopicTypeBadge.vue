<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import ForumTopicStatusBadge from './ForumTopicStatusBadge.vue'

const { type, status, goodIssue = false, iconOnly = false, interactive = false } = defineProps<{
  type: ForumAPI.TopicType
  status?: ForumAPI.TopicStatus
  goodIssue?: boolean
  iconOnly?: boolean
  interactive?: boolean
}>()

const emit = defineEmits<{ filterType: [type: 'bug' | 'feat'], filterStatus: [status: ForumAPI.TopicStatus | 'good-issue'] }>()
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

const typeText = computed(() => type ? topicTypeMap.value.get(type) : undefined)
const statusText = computed(() => status ? message.value.forum.topic.status[status] : undefined)
const goodIssueText = computed(() => goodIssue ? message.value.forum.topic.status.goodIssue : undefined)
const accessibleLabel = computed(() => [typeText.value, statusText.value, goodIssueText.value].filter(Boolean).join(' • '))
const typeFilter = computed(() => type === 'BUG' ? 'bug' : type === 'FEAT' ? 'feat' : null)

function filterByType() {
  if (typeFilter.value)
    emit('filterType', typeFilter.value)
}

function filterByStatus(value: ForumAPI.TopicStatus | 'good-issue') {
  emit('filterStatus', value)
}
</script>

<template>
  <span
    v-if="type"
    class="font-size-xs flex items-center"
    :aria-label="iconOnly ? accessibleLabel : undefined"
    :title="iconOnly ? accessibleLabel : undefined"
  >
    <span class="mr-1 flex gap-1 items-center">
      <button
        v-if="interactive && typeFilter"
        type="button"
        class="forum-badge-square-filter"
        aria-hidden="true"
        tabindex="-1"
        :title="typeText"
        @pointerdown.stop
        @click.stop="filterByType"
      >
        <span class="rounded-[2px] size-12px inline-block" :class="typeColorClass[type]" aria-hidden="true" />
      </button>
      <span v-else class="rounded-[2px] size-12px inline-block" :class="typeColorClass[type]" aria-hidden="true" />
      <button
        v-if="status && interactive"
        type="button"
        class="forum-badge-square-filter forum-badge-state-square-filter"
        aria-hidden="true"
        tabindex="-1"
        :title="statusText"
        @pointerdown.stop
        @click.stop="filterByStatus(status)"
      >
        <ForumTopicStatusBadge :status="status" />
      </button>
      <ForumTopicStatusBadge v-else-if="status" :status="status" />
      <button
        v-if="goodIssue && interactive"
        type="button"
        class="forum-badge-square-filter forum-badge-state-square-filter"
        aria-hidden="true"
        tabindex="-1"
        :title="goodIssueText"
        @pointerdown.stop
        @click.stop="filterByStatus('good-issue')"
      >
        <ForumTopicStatusBadge status="good-issue" />
      </button>
      <ForumTopicStatusBadge v-else-if="goodIssue" status="good-issue" />
    </span>
    <template v-if="!iconOnly">
      <button
        v-if="interactive && typeFilter"
        type="button"
        class="forum-badge-text-filter"
        @pointerdown.stop
        @click.stop="filterByType"
      >
        {{ typeText }}
      </button>
      <template v-else>
        {{ typeText }}
      </template>
      <template v-if="statusText">
        <span aria-hidden="true"> • </span>
        <slot name="status">
          <button
            v-if="interactive && status"
            type="button"
            class="forum-badge-text-filter forum-badge-state-text-filter"
            @pointerdown.stop
            @click.stop="filterByStatus(status)"
          >
            {{ statusText }}
          </button>
          <template v-else>
            {{ statusText }}
          </template>
        </slot>
      </template>
      <template v-if="goodIssueText">
        <span aria-hidden="true"> • </span>
        <button
          v-if="interactive"
          type="button"
          class="forum-badge-text-filter forum-badge-state-text-filter"
          @pointerdown.stop
          @click.stop="filterByStatus('good-issue')"
        >
          {{ goodIssueText }}
        </button>
        <template v-else>
          {{ goodIssueText }}
        </template>
      </template>
    </template>
  </span>
</template>

<style scoped>
.forum-badge-square-filter {
  display: inline-flex;
  border: 0;
  border-radius: 2px;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.forum-badge-square-filter:hover,
.forum-badge-square-filter:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.forum-badge-text-filter {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.forum-badge-text-filter:hover,
.forum-badge-text-filter:focus-visible {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.forum-badge-state-square-filter:hover,
.forum-badge-state-square-filter:focus-visible {
  outline-color: var(--vp-c-border);
}

.forum-badge-state-text-filter:hover,
.forum-badge-state-text-filter:focus-visible {
  color: var(--vp-c-text-1);
}
</style>
