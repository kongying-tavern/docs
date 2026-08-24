<script setup lang="ts">
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumCopyLinkButton from '../ForumCopyLinkButton.vue'
import ForumTopicReactionButton from '../ForumTopicReactionButton.vue'

defineProps<{
  topicId: string
}>()

const { message } = useLocalized()
const { homeHref } = useForumRoute()
const forumHref = computed(() => homeHref())
</script>

<template>
  <div class="mt-12 flex items-center justify-between">
    <div class="flex gap-1.5">
      <ForumTopicReactionButton :topic-id="topicId" />
      <ForumCopyLinkButton />
    </div>
    <a class="text-sm vp-link" :href="forumHref">
      {{ message.forum.topic.backToFeedbackForum }}
    </a>
  </div>
</template>
