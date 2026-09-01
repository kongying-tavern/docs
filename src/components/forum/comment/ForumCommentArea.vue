<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { createReusableTemplate, useElementBounding, useIntersectionObserver, watchOnce } from '@vueuse/core'
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { scrollTo } from '~/composables/scrollTo'
import { useNavigateToTopic } from '../composables/useNavigateToTopic'
import ForumLoadState from '../ui/ForumLoadState.vue'
import { useCommentAreaState } from './composables/useCommentAreaState'
import ForumCommentInputBox from './ForumCommentInputBox.vue'
import ForumTopicComment from './ForumTopicComment.vue'

const props = withDefaults(defineProps<{
  repo: ForumAPI.Repo
  topicId: string
  topicAuthorId: string | number
  inline?: boolean
  commentCount?: number
  topic?: ForumAPI.Topic
  autofocusInput?: boolean
  /** 数据加载后替换骨架屏的内容传 false,避免重复播放入场动画 */
  entryAnimation?: boolean
}>(), {
  entryAnimation: true,
})

const { message } = useLocalized()

const {
  replyCommentID: _replyCommentID,
  commentInputBoxIsVisible,
  isMobile,
  renderComments,
  commentPages,
  allCommentCount,
  currentCommentPage,
  targetCommentId,
  targetCommentReady,
  loadStateMessage,
  commentLoading,
  commentError,
  isClosedComment,
  isReplyingTo,
  toggleCommentReply,
  handleCommentSubmit,
  retry,
  setCommentInputBoxVisible,
  canLoadMoreComment,
} = useCommentAreaState(props)

const { detailHref } = useNavigateToTopic(props.topicId)

const commentArea = useTemplateRef('commentArea')
const commentInputBox = useTemplateRef('commentInputBox')
const { right, left, width } = useElementBounding(commentArea)
const [CommentAreaCommentInputBox, UseCommentAreaCommentInputBox] = createReusableTemplate()
const inputObservationTarget = computed(() => (
  !props.inline && renderComments.value.length >= 5 ? commentInputBox.value : null
))
useIntersectionObserver(
  inputObservationTarget,
  ([entry]) => {
    setCommentInputBoxVisible(!!entry?.isIntersecting)
  },
)

watchOnce(commentLoading, async () => {
  if (props.inline || targetCommentId.value)
    return
  await nextTick()
  scrollTo()
})

let lastScrolledCommentId: string | null = null
watch([targetCommentId, targetCommentReady], async ([commentId, ready]) => {
  if (!commentId) {
    lastScrolledCommentId = null
    return
  }
  if (!ready || commentId === lastScrolledCommentId)
    return

  lastScrolledCommentId = commentId
  await nextTick()
  scrollTo({ hash: `#reply-${commentId}` })
}, { immediate: true })
</script>

<template>
  <div>
    <CommentAreaCommentInputBox>
      <ForumCommentInputBox
        :repo="repo"
        :autofocus="autofocusInput"
        :placeholder="message.forum.comment.placeholder"
        :topic-id="topicId"
        :topic="topic"
        @comment:submit="handleCommentSubmit"
      />
    </CommentAreaCommentInputBox>
    <div
      v-if="!isClosedComment"
      ref="commentArea"
      :class="{ 'pb-24': !inline }"
    >
      <p
        v-if="!inline"
        id="reply"
        class="font-(size-5 --vp-font-family-subtitle) line-height-[21px] mb-5.5 mt-4"
      >
        {{ message.forum.comment.commentCount }}
        <span class="font-size-3.5 color-[var(--vp-c-text-3)] vertical-text-top">
          {{ allCommentCount }}
        </span>
      </p>
      <UseCommentAreaCommentInputBox ref="commentInputBox" />
      <div class="comment-list mt-8" :class="entryAnimation && 'slide-enter'">
        <ForumTopicComment
          v-for="(comment, index) in renderComments"
          :id="`reply-${comment.id}`"
          :key="comment.id"
          :class="{ 'last-comment': index === renderComments.length - 1 }"
          :repo="repo"
          :topic-author-id="topicAuthorId"
          :topic-id="topicId"
          :comment-data="comment"
          :comment-page="commentPages.get(String(comment.id)) ?? 1"
          :comment-click-handler="() => toggleCommentReply(comment.id)"
        >
          <ForumCommentInputBox
            v-if="isReplyingTo(comment.id)"
            class="mt-4"
            :repo="repo"
            :topic-id="topicId"
            :topic="topic"
            :reply-target="comment.author.login"
            :placeholder="`${message.forum.comment.reply} @${comment.author.username}：`"
            @comment:submit="handleCommentSubmit"
          />
        </ForumTopicComment>

        <ForumLoadState
          v-if="!inline"
          :loading="commentLoading"
          :error="Boolean(commentError)"
          :retry="retry"
          :text="loadStateMessage"
        />

        <a
          v-if="canLoadMoreComment && inline"
          class="font-size-3 c-[var(--vp-c-text-3)] vp-link text-center w-full cursor-pointer"
          :href="detailHref('reply')"
        >
          {{ message.forum.comment.loadMoreComment }}
        </a>
      </div>
      <Separator
        v-if="(currentCommentPage === 1 && commentLoading) && !inline"
        class="font-size-3 c-[var(--vp-c-text-3)] my-8 text-center w-full inline-block"
        :label="message.forum.comment.loadingComment"
      />
      <Teleport to="body">
        <div
          v-if="!commentInputBoxIsVisible"
          class="pt-8 border-t bg-[--vp-c-bg] bottom-0 fixed z-2"
          :style="{ left: `${left}px`, right: `${right}px`, width: isMobile ? '100vw' : `${width}px` }"
        >
          <UseCommentAreaCommentInputBox class="pb-6" />
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style>
.comment-list.forum-topic-item:hover > .topic-info > div > .topic-info-list > .topic-btn-more {
  opacity: 1 !important;
}
</style>
