<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useForumTopicPresentation } from '~/forum/composables/view/useForumTopicPresentation'

defineProps<{ topic: ForumAPI.Topic, compact: boolean, height: number }>()
const presentation = useForumTopicPresentation()
</script>

<template>
  <div class="forum-topic-item my-1 px-4 py-2 rounded-xl w-full" :style="{ height: `${height}px` }" :data-forum-topic="topic.id" data-scroll-preview aria-hidden="true">
    <div class="top-18 sticky">
      <div class="text-xs color-[--vp-c-text-3] mb-1">
        {{ topic.user.username }}
      </div>
      <h4 v-if="!compact && topic.type !== 'BUG'" class="font-size-4.5 font-[--vp-font-family-subtitle] line-clamp-2">
        {{ topic.title }}
      </h4>
      <article class="font-size-3.5 mt-1 pr-4 whitespace-pre-wrap break-words" :class="presentation?.expanded.get(topic.id) ? '' : compact ? 'line-clamp-2' : 'line-clamp-4'">
        {{ topic.content.text }}
      </article>
    </div>
  </div>
</template>
