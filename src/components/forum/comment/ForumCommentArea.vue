<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { createReusableTemplate, useElementBounding, useIntersectionObserver, watchOnce } from '@vueuse/core'
import { nextTick, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
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
  replyCommentID: _replyCommentID,
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
const isInitialized = ref(false)
let stopObserver: (() => void) | null = null

watch(
  () => props.commentCount,
  async (count) => {
    if (!isInitialized.value && count && count > 0) {
      isInitialized.value = true
      await initialize()
    }
  },
  { immediate: true },
)

watch(
  renderComments,
  async (list) => {
    if (!stopObserver && list.length >= 5 && commentInputBox.value) {
      const { stop } = useIntersectionObserver(
        commentInputBox,
        ([entry]) => {
          setCommentInputBoxVisible(!!entry?.isIntersecting)
        },
      )
      stopObserver = stop
    }
  },
  { flush: 'post' },
)

// Scroll to comments when loading completes
watchOnce(commentLoading, async () => {
  await nextTick()
  scrollTo()
})

onUnmounted(cleanup)
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
      <p id="reply" class="font-size-5 line-height-[21px] font-[var(--vp-font-family-subtitle)] mb-5.5 mt-4">
        {{ message.forum.comment.commentCount }}
        <span class="font-size-3.5 color-[var(--vp-c-text-3)] vertical-text-top">
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
        class="font-size-3 c-[var(--vp-c-text-3)] my-8 text-center w-full inline-block"
        :label="message.forum.comment.loadingComment"
      />
      <Teleport to="body">
        <div v-if="!commentInputBoxIsVisible" class="pt-8 border-t bg-[--vp-c-bg] bottom-0 fixed z-2" :style="{ left: `${left}px`, right: `${right}px`, width: isMobile ? '100vw' : `${width}px` }">
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
