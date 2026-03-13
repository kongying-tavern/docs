<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import { useTopicContent } from './composables/useTopicContent'

const { topic } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
}>()

const emit = defineEmits<{
  'content:click': []
  'read-more:click': []
  'expand:click': []
}>()

const { message } = useLocalized()

// Use topic content composable
const {
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
} = useTopicContent({ topic })

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
      class="content-main mt-1"
      @click="handleContentClick"
    >
      <!-- Title -->
      <h4
        v-if="shouldShowTitle"
        class="mt-2 flex break-words line-clamp-2"
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
        class="font-size-3.5 mt-1 pr-4 opacity-99 whitespace-pre-wrap transition-all duration-300 overflow-hidden"
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
          class="font-size-4 px-0"
          variant="link"
          @click.stop="handleReadMoreClick"
        >
          {{ message.forum.readMore }}
        </Button>

        <!-- Expand Button for Topics -->
        <Button
          v-else-if="!isAnn && hasOverflow && !isExpanded"
          class="font-size-4 px-0"
          variant="link"
          @click.stop="handleExpandClick"
        >
          {{ message.forum.topic.showMore }}
        </Button>
      </article>

      <!-- Compact Mode Content -->
      <div
        v-if="isCompactMode"
        class="font-size-3.5 mt-1 opacity-99 whitespace-pre-wrap overflow-hidden"
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
