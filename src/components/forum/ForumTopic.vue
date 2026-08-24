<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useForumViewMode } from '~/composables/useForumViewMode'
import ForumCommentArea from './comment/ForumCommentArea.vue'
import ForumTopicComment from './comment/ForumTopicComment.vue'
import { useTopicInteraction } from './composables/useTopicInteraction'
import { useTopicState } from './composables/useTopicState'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicTranslator from './ForumTopicTranslator.vue'
import ForumTopicContent from './topic/ForumTopicContent.vue'
import ForumTopicHeader from './topic/ForumTopicHeader.vue'
import ForumTopicMedia from './topic/ForumTopicMedia.vue'
import ForumTagList from './ui/ForumTagList.vue'

const { topic } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
  comment?: ForumAPI.Comment
}>()

// Topic state management
const { translator, menu: baseMenu, showComment } = useTopicState(topic)

// View mode from hook
const { isCardMode, isCompactMode } = useForumViewMode()

// Filter menu based on view mode - translator only available in Card mode
const menu = computed(() => {
  if (!isCardMode.value) {
    return baseMenu.value.filter(item => 'id' in item && item.id !== 'translator')
  }
  return baseMenu.value
})

// Topic interaction logic
const {
  inReply,
  detailHref,
  handleToggleCommentInput,
} = useTopicInteraction(topic)
</script>

<template>
  <div
    :id="`topic-${topic.id}`"
    class="forum-topic-item my-1 px-4 py-2 rounded-xl w-full hover:bg-[var(--vp-c-default-soft)]"
    :class="[topic.type]"
  >
    <div class="topic-content">
      <!-- Topic Header -->
      <ForumTopicHeader
        :topic="topic"
        :topic-author-id="topic.user.id"
        :menu="menu"
      />

      <!-- Topic Content and Media -->
      <div :class="isCompactMode ? 'flex w-full justify-between items-start flex-nowrap' : 'block'">
        <!-- Content Section -->
        <div :class="isCompactMode ? 'max-w-[calc(100%-100px)] overflow-hidden flex-1 min-w-0' : ''">
          <ForumTopicContent
            :topic="topic"
            :detail-href="detailHref()"
          />

          <!-- Translator (Card Mode Only) -->
          <ForumTopicTranslator
            v-if="isCardMode"
            :key="`translator-${topic.id}`"
            ref="translator"
            :content="topic.content.text"
            :source-language="topic.language"
          />
        </div>

        <!-- Media for Compact Mode (right side) -->
        <ForumTopicMedia
          v-if="isCompactMode"
          class="shrink-0 w-100px"
          :topic="topic"
        />
      </div>

      <!-- Media for Card Mode (below content) -->
      <ForumTopicMedia
        v-if="isCardMode"
        :topic="topic"
      />
    </div>

    <!-- Tags -->
    <ForumTagList
      v-if="isCardMode"
      class="mt-2"
      :data="topic.tags"
    />

    <!-- Topic Footer -->
    <ForumTopicFooter
      v-if="topic.type !== 'POST'"
      :class="{ 'mt-4': isCardMode, 'mt-2': isCompactMode }"
      :topic-data="topic"
      :comment-id="topic.type === 'ANN' ? -1 : 1"
      @comment:click="handleToggleCommentInput"
    />

    <!-- Related Comments -->
    <div
      v-if="showComment && topic.relatedComments?.length && !isCompactMode && !inReply"
      class="topic-comment"
    >
      <ForumTopicComment
        v-for="(commentItem, index) in topic.relatedComments"
        :key="commentItem.id"
        v-motion-slide-top
        class="bg---vp-c-bg-soft px-4 first:mt-4"
        :class="{ 'rounded-b-none': inReply && index > 0, 'rounded-t-none': index > 0 }"
        repo="Feedback"
        size="small"
        :comment-count="-1"
        :comment-data="commentItem"
        :topic-author-id="topic.user.id"
        :topic-id="topic.id"
        @comment:click="handleToggleCommentInput"
      />
    </div>

    <!-- Comment Input -->
    <ForumCommentArea
      v-if="inReply && !isCompactMode"
      class="mt-4"
      :inline="true"
      repo="Feedback"
      :topic-id="topic.id!"
      :topic-author-id="topic.user.id"
      :comment-count="topic.commentCount"
    />
  </div>
</template>

<style lang="scss" scoped>
.forum-topic-item:not(.ANN):hover .topic-detail-link {
  text-decoration: underline;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes fade-out {
  to {
    opacity: 0;
  }
}
</style>
