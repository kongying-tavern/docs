<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useLocalized } from '@/hooks/useLocalized'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import { useTopicContent } from './composables/useTopicContent'

const { topic, detailHref } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
  detailHref: string
}>()

const emit = defineEmits<{
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

function handleExpandClick(): void {
  toggleExpand()
  emit('expand:click')
}
</script>

<template>
  <div class="topic-content">
    <div class="content-main mt-1">
      <!-- Title -->
      <h4
        v-if="shouldShowTitle"
        class="mt-2 flex break-words line-clamp-2"
        :class="{
          'font-size-4.5 font-[--vp-font-family-title]': isCardMode,
          'font-size-3.5 font-[--vp-font-family-subtitle]': isCompactMode,
        }"
      >
        <a v-if="!isAnn" class="topic-detail-link vp-link line-clamp-2" :href="detailHref">
          {{ displayTitle }}
        </a>
        <p v-else class="line-clamp-2">
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
        <a
          v-if="topic.type !== 'POST' && !isAnn"
          class="topic-detail-link color-inherit no-underline block"
          :class="{ 'line-clamp-4': !isExpanded }"
          :href="detailHref"
        >{{ displayContent }}</a>

        <div v-else-if="isAnn" :class="{ 'line-clamp-4': !isExpanded }">
          {{ displayContent }}
        </div>

        <div v-else>
          {{ displayContent }}
        </div>
        <!-- Read More Button for Posts -->
        <a
          v-if="isPost"
          class="font-size-4 vp-link py-2 inline-flex"
          :href="detailHref"
        >
          {{ message.forum.readMore }}
        </a>

        <!-- Expand Button for Topics -->
        <button
          v-else-if="!isAnn && hasOverflow && !isExpanded"
          type="button"
          class="font-size-4 vp-link px-0 py-2 border-0 bg-transparent"
          @click="handleExpandClick"
        >
          {{ message.forum.topic.showMore }}
        </button>
      </article>

      <!-- Compact Mode Content -->
      <div
        v-if="isCompactMode"
        class="font-size-3.5 mt-1 opacity-99 whitespace-pre-wrap overflow-hidden"
      >
        <a
          v-if="topic.type !== 'POST' && !isAnn"
          class="topic-detail-link color-inherit no-underline block line-clamp-2"
          :href="detailHref"
        >{{ displayContent }}</a>

        <div v-else-if="isAnn" class="line-clamp-2">
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
