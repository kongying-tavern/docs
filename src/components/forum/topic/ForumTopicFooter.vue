<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumTopicReactionButton from '../ui/ForumTopicReactionButton.vue'
import ForumCopyLinkButton from './ForumCopyLinkButton.vue'

defineProps<{ topic: ForumAPI.Topic }>()

const { message } = useLocalized()
const { homeHref } = useForumRoute()
const forumHref = computed(() => homeHref())
</script>

<template>
  <div class="mt-12 flex items-center justify-between">
    <div class="flex gap-1.5">
      <ForumTopicReactionButton :topic-id="String(topic.id)" />
      <ForumCopyLinkButton />
    </div>
    <a class="text-sm vp-link" :href="forumHref">
      {{ message.forum.topic.backToFeedbackForum }}
    </a>
  </div>
</template>
