<script setup lang="ts">
import ForumCopyLinkButton from '../ForumCopyLinkButton.vue'
import ForumTopicReactionButton from '../ForumTopicReactionButton.vue'

defineProps<{
  topicId: string
}>()
</script>

<template>
  <div class="mt-12 flex items-center justify-between">
    <div class="flex gap-1.5">
      <ForumTopicReactionButton :topic-id="topicId" />
      <ForumCopyLinkButton />
    </div>
  </div>
</template>
