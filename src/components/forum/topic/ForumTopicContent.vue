<script setup lang="ts">
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import { useTopicContent } from './composables/useTopicContent'

const { topic, viewMode } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
  viewMode: FORUM.TopicViewMode
}>()

const emit = defineEmits<{
  'content:click': []
  'read-more:click': []
  'expand:click': []
}>()

const { message } = useLocalized()

// Use topic content composable
const {
  renderedText: _renderedText,
  isPost,
  isAnn,
  isCardMode,
  isCompactMode,
  isExpanded,
  hasOverflow,
  toggleExpand,
  shouldShowTitle,
  displayTitle,
  displayContent,
} = useTopicContent({
  topic,
  viewMode: () => viewMode,
})

// Event handlers
function handleContentClick(): void {
  if (topic.type !== 'ANN') {
    emit('content:click')
  }
}

function handleReadMoreClick(): void {
  emit('read-more:click')
}

function handleExpandClick(): void {
  toggleExpand()
  emit('expand:click')
}
</script>

<template>
  <div class="topic-content">
    <div
      class="content-main"
      @click="handleContentClick"
    >
      <!-- Title -->
      <h4
        v-if="shouldShowTitle"
        class="line-clamp-2 mt-2 flex break-words"
        :class="{
          'font-size-4.5 font-[--vp-font-family-title]': isCardMode,
          'font-size-3.5 font-[--vp-font-family-subtitle]': isCompactMode,
        }"
      >
        <p class="line-clamp-2">
          {{ displayTitle }}
        </p>
      </h4>

      <!-- Type Badge -->
      <ForumTopicTypeBadge v-if="isCardMode" :type="topic.type" />

      <!-- Content Article -->
      <article
        v-if="isCardMode"
        class="mt-1 overflow-hidden whitespace-pre-wrap pr-4 font-size-3.5 opacity-99 transition-all duration-300"
      >
        <div v-if="topic.type !== 'POST'" :class="{ 'line-clamp-4': !(isExpanded || isAnn) }">
          {{ displayContent }}
        </div>

        <div v-else>
          {{ displayContent }}
        </div>
        <!-- Read More Button for Posts -->
        <Button
          v-if="isPost"
          class="px-0 font-size-4"
          variant="link"
          @click.stop="handleReadMoreClick"
        >
          {{ message.forum.readMore }}
        </Button>

        <!-- Expand Button for Topics -->
        <Button
          v-else-if="!isAnn && hasOverflow && !isExpanded"
          class="px-0 font-size-4"
          variant="link"
          @click.stop="handleExpandClick"
        >
          {{ message.forum.topic.showMore }}
        </Button>
      </article>

      <!-- Compact Mode Content -->
      <div
        v-if="isCompactMode"
        class="mt-1 overflow-hidden whitespace-pre-wrap font-size-3.5 opacity-99"
      >
        <div v-if="topic.type !== 'POST'" class="line-clamp-2">
          {{ displayContent }}
        </div>

        <div v-else>
          {{ displayContent }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-main {
  transition: all 0.2s ease;
}
</style>
