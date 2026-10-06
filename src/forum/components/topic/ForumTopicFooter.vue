<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import ForumTopicReactionButton from '../ui/ForumTopicReactionButton.vue'
import ForumCopyLinkButton from './ForumCopyLinkButton.vue'
import ForumQuoteTopicButton from './ForumQuoteTopicButton.vue'

defineProps<{ topic: ForumAPI.Topic }>()
</script>

<template>
  <div class="mt-12 flex flex-wrap gap-3 items-center">
    <ForumTopicReactionButton :topic-id="String(topic.id)" refetch-on-mount="always" />
    <ForumQuoteTopicButton :topic="topic" />
    <ForumCopyLinkButton />
  </div>
</template>
