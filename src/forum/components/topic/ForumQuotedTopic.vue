<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useForumTopicQuery } from '~/forum/composables/data/useForumQueries'
import ForumQuotedTopicCard from './ForumQuotedTopicCard.vue'

const { compact = false, reference } = defineProps<{ reference: ForumAPI.QuotedTopicReference, compact?: boolean }>()
const query = useForumTopicQuery(() => reference.id)
const topic = computed(() => String(query.data.value?.id ?? '') === reference.id
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
