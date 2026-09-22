<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useForumTopicQuery } from '~/composables/forum/useForumQueries'
import ForumQuotedTopicCard from './ForumQuotedTopicCard.vue'

const props = withDefaults(defineProps<{ reference: ForumAPI.QuotedTopicReference, compact?: boolean }>(), {
  compact: false,
})
const query = useForumTopicQuery(() => props.reference.id)
const topic = computed(() => String(query.data.value?.id ?? '') === props.reference.id
  ? query.data.value
  : undefined)
</script>

<template>
  <ForumQuotedTopicCard
    data-forum-shared-topic="quote"
    :reference="reference"
    :compact="compact"
    :topic="topic"
    :loading="query.isLoading.value || (!topic && !query.error.value)"
    :unavailable="Boolean(query.error.value)"
    @retry="query.refetch()"
  />
</template>
