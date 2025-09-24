<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from './types'
import { computed } from 'vue'
import ForumCommentInputBox from './comment/ForumCommentInputBox.vue'
import ForumTopicComment from './comment/ForumTopicComment.vue'
import { useTopicInteraction } from './composables/useTopicInteraction'
import { useTopicState } from './composables/useTopicState'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicTranslator from './ForumTopicTranslator.vue'
import ForumTopicContent from './topic/ForumTopicContent.vue'
import ForumTopicHeader from './topic/ForumTopicHeader.vue'
import ForumTopicMedia from './topic/ForumTopicMedia.vue'
import ForumTagList from './ui/ForumTagList.vue'

const { topic, viewMode } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
  comment?: ForumAPI.Comment
  viewMode: FORUM.TopicViewMode
}>()

// Topic state management
const { translator, menu: baseMenu, showComment } = useTopicState(topic)

// View mode computed properties
const isCardMode = computed(() => viewMode === 'Card')
const isCompactMode = computed(() => viewMode === 'Compact')

// Filter menu based on view mode - translator only available in Card mode
const menu = computed(() => {
  if (!isCardMode.value) {
    return baseMenu.value.filter(item => item.id !== 'translator')
  }
  return baseMenu.value
})

// Topic interaction logic
const {
  replyTarget,
  userSubmittedComment,
  inReply,
  isPost,
  toPostDetailPage,
  handleCommentSubmit,
  handleToggleCommentInput,
  handleTopicClick,
  handleMenuAction,
} = useTopicInteraction(topic, viewMode)

// Event handlers
function handleContentClick(): void {
  handleTopicClick()
}

function handleReadMoreClick(): void {
  toPostDetailPage()
}
</script>

<template>
  <div
    :id="`topic-${topic.id}`"
    class="forum-topic-item my-1 w-full rounded-xl px-4 py-2 hover:bg-[var(--vp-c-bg-soft)]"
    :class="[topic.type]"
  >
    <div class="topic-content">
      <!-- Topic Header -->
      <ForumTopicHeader
        :topic="topic"
        :topic-author-id="topic.user.id"
        :menu="menu"
        @menu:action="handleMenuAction"
      />

      <!-- Topic Content and Media -->
      <div
        :class="isCompactMode ? 'flex w-full justify-between items-start flex-nowrap' : 'block'"
      >
        <!-- Content Section -->
        <div
          class="cursor-pointer"
          :class="isCompactMode ? 'max-w-[calc(100%-100px)] overflow-hidden flex-1 min-w-0' : ''"
          @click="handleContentClick"
        >
          <ForumTopicContent
            :topic="topic"
            :view-mode="viewMode"
            @content:click="handleContentClick"
            @read-more:click="handleReadMoreClick"
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
          class="w-100px flex-shrink-0"
          :topic="topic"
          :view-mode="viewMode"
        />
      </div>

      <!-- Media for Card Mode (below content) -->
      <ForumTopicMedia
        v-if="isCardMode"
        :topic="topic"
        :view-mode="viewMode"
      />
    </div>

    <!-- Tags -->
    <ForumTagList v-if="isCardMode" class="mt-2" :data="topic.tags" />

    <!-- Topic Footer -->
    <ForumTopicFooter
      v-if="topic.type !== 'POST'"
      :class="{ 'mt-4': isCardMode, 'mt-2': isCompactMode }"
      :topic-data="topic"
      :comment-id="topic.type === 'ANN' ? -1 : 1"
      :view-mode="viewMode"
      @comment:click="handleToggleCommentInput"
    />

    <!-- Related Comments -->
    <div v-if="showComment && topic.relatedComments && viewMode !== 'Compact'" class="topic-comment">
      <ForumTopicComment
        v-for="(commentItem, index) in [
          ...topic.relatedComments,
          ...userSubmittedComment,
        ]"
        :key="commentItem.id"
        v-motion-slide-top
        class="bg-[var(--vp-c-bg-soft)] px-4 first:mt-4"
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
    <ForumCommentInputBox
      v-if="inReply && viewMode !== 'Compact'"
      :id="`reply-${topic.id}`"
      repo="Feedback"
      class="rounded-md bg-[var(--vp-c-bg-soft)] px-8 pb-4"
      :class="{
        'rounded-t-none': showComment && topic.relatedComments,
        'important:py-4': !topic.relatedComments,
      }"
      :topic-id="String(topic.id)"
      :reply-target="replyTarget"
      :collapse="false"
      @comment:submit="handleCommentSubmit"
    />
  </div>
</template>

<style lang="scss" src="./ForumTopic.scss"></style>
