<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { createReusableTemplate, useElementBounding, useIntersectionObserver, watchOnce } from '@vueuse/core'
import { nextTick, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { scrollTo } from '~/composables/scrollTo'
import ForumLoadState from '../ui/ForumLoadState.vue'
import { useCommentAreaState } from './composables/useCommentAreaState'
import ForumCommentInputBox from './ForumCommentInputBox.vue'
import ForumTopicComment from './ForumTopicComment.vue'

const props = defineProps<{
  repo: ForumAPI.Repo
  topicId: string
  topicAuthorId: string | number
  commentCount?: number
}>()

const { message } = useLocalized()

// Comment area state management
const {
  replyCommentID,
  commentInputBoxIsVisible,
  isMobile,
  renderComments,
  allCommentCount,
  currentCommentPage,
  loadStateMessage,
  commentLoading,
  isClosedComment,
  isReplyingTo,
  toggleCommentReply,
  handleCommentSubmit,
  initialize,
  cleanup,
  setCommentInputBoxVisible,
} = useCommentAreaState(props)

// Template refs and UI state
const commentArea = useTemplateRef('commentArea')
const commentInputBox = useTemplateRef('commentInputBox')
const { right, left, width } = useElementBounding(commentArea)
const [CommentAreaCommentInputBox, UseCommentAreaCommentInputBox] = createReusableTemplate()

// Lifecycle hooks
onMounted(async () => {
  await initialize()

  if (renderComments.value.length < 5)
    return

  useIntersectionObserver(
    commentInputBox,
    ([entry]) => {
      setCommentInputBoxVisible(entry?.isIntersecting || false)
    },
  )
})

onUnmounted(cleanup)

// Scroll to comments when loading completes
watchOnce(commentLoading, async () => {
  await nextTick()
  scrollTo()
})
</script>

<template>
  <div>
    <CommentAreaCommentInputBox>
      <ForumCommentInputBox
        :repo="repo" :placeholder="message.forum.comment.placeholder" :topic-id="topicId"
        @comment:submit="handleCommentSubmit"
      />
    </CommentAreaCommentInputBox>
    <div v-if="!isClosedComment" ref="commentArea" class="pb-24">
      <p id="reply" class="mb-5.5 mt-4 font-size-5 line-height-[21px] font-[var(--vp-font-family-subtitle)]">
        {{ message.forum.comment.commentCount }}
        <span class="vertical-text-top font-size-3.5 color-[var(--vp-c-text-3)]">
          {{ allCommentCount }}
        </span>
      </p>
      <UseCommentAreaCommentInputBox ref="commentInputBox" />
      <div class="slide-enter comment-list mt-8">
        <ForumTopicComment
          v-for="comment in renderComments" :id="`reply-${comment.id}`" :key="comment.id" :repo="repo"
          :topic-author-id="topicAuthorId" :topic-id="topicId" :comment-data="comment"
          :comment-click-handler="() => toggleCommentReply(comment.id)"
        >
          <ForumCommentInputBox
            v-if="isReplyingTo(comment.id)" class="mt-4" :repo="repo" :topic-id="topicId"
            :reply-target="comment.author.login"
            :placeholder="`${message.forum.comment.reply} @${comment.author.username}：`"
            @comment:submit="handleCommentSubmit"
          />
        </ForumTopicComment>

        <ForumLoadState :loading="commentLoading" :text="loadStateMessage" />
      </div>

      <Separator
        v-if="currentCommentPage === 1 && commentLoading"
        class="my-8 inline-block w-full text-center font-size-3 c-[var(--vp-c-text-3)]"
        :label="message.forum.comment.loadingComment"
      />
      <Teleport to="body">
        <div v-if="!commentInputBoxIsVisible" class="fixed bottom-0 z-2 border-t bg-[--vp-c-bg] pt-8" :style="{ left: `${left}px`, right: `${right}px`, width: isMobile ? '100vw' : `${width}px` }">
          <UseCommentAreaCommentInputBox class="pb-6" />
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style>
.comment-list.forum-topic-item:hover>.topic-info>div>.topic-info-list>.topic-btn-more {
  opacity: 1 !important;
}
</style>
