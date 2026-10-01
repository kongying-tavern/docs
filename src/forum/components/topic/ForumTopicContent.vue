<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import ForumTopicMetadataControl from './ForumTopicMetadataControl.vue'
import ForumTopicSummary from './ForumTopicSummary.vue'

const props = defineProps<{ topic: ForumAPI.Topic | ForumAPI.Post, detailHref: string, contentOverride?: string, titleOverride?: string }>()
const emit = defineEmits<{ 'expand:click': [], 'summary-click': [] }>()
const { topicHref } = useForumRoute()
</script>

<template>
  <ForumTopicSummary v-bind="props" :topic-href="id => topicHref(id, null)" @expand:click="emit('expand:click')" @summary-click="emit('summary-click')">
    <template #metadata>
      <ForumTopicMetadataControl :topic="topic.type !== 'POST' ? topic : undefined" :type="topic.type" :topic-id="topic.id" :state="topic.state" :status="topic.status" :good-issue="topic.goodIssue" interactive />
    </template>
    <template #translation>
      <slot name="translation" />
    </template>
  </ForumTopicSummary>
</template>
