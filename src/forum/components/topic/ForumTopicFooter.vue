<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import ForumTopicReactionButton from '../ui/ForumTopicReactionButton.vue'
import ForumCopyLinkButton from './ForumCopyLinkButton.vue'
import ForumQuoteTopicButton from './ForumQuoteTopicButton.vue'

defineProps<{ topic: ForumAPI.Topic }>()
</script>

<template>
  <div class="mt-12 flex items-center justify-between">
    <div class="flex gap-3">
      <ForumTopicReactionButton :topic-id="String(topic.id)" refetch-on-mount="always" />
      <ForumQuoteTopicButton :topic="topic" />
      <ForumCopyLinkButton />
    </div>
  </div>
</template>
