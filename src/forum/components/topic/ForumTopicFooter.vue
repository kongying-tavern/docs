<script setup lang="ts">
import type ForumAPI from '~/forum/api/forum'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import ForumTopicReactionButton from '../ui/ForumTopicReactionButton.vue'
import ForumCopyLinkButton from './ForumCopyLinkButton.vue'
import ForumQuoteTopicButton from './ForumQuoteTopicButton.vue'

defineProps<{ topic: ForumAPI.Topic }>()

const { message } = useLocalized()
const { homeHref } = useForumRoute()
const forumHref = computed(() => homeHref())
</script>

<template>
  <div class="mt-12 flex items-center justify-between">
    <div class="flex gap-3">
      <ForumTopicReactionButton :topic-id="String(topic.id)" refetch-on-mount="always" />
      <ForumQuoteTopicButton :topic="topic" />
      <ForumCopyLinkButton />
    </div>
    <a class="text-sm vp-link" :href="forumHref">
      {{ message.forum.topic.backToFeedbackForum }}
    </a>
  </div>
</template>
