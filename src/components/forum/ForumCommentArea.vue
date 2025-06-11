<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { Ref } from 'vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { createReusableTemplate, useElementBounding, useInfiniteScroll, useIntersectionObserver, useMediaQuery, watchOnce } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

import { scrollTo } from '~/composables/scrollTo'
import { useTopicComments } from '~/composables/useTopicComment'

import ForumCommentInputBox from './ForumCommentInputBox.vue'
import ForumLoadState from './ForumLoadState.vue'
import ForumTopicComment from './ForumTopicComment.vue'

const {
  repo,
  topicId,
  topicAuthorId,
  commentCount = null,
} = defineProps<{
  repo: ForumAPI.Repo
  topicId: string
  topicAuthorId: string | number
  commentCount?: number
}>()

const { message } = useLocalized()

const {
  userSubmittedComment,
  comments,
  noComment,
  loadMoreComment,
  canLoadMoreComment,
  loadStateMessage,
  submitComment,
  commentLoading,
  allCommentCount,
  currentCommentPage,
  initComments,
} = useTopicComments()

const commentArea = useTemplateRef('commentArea')
const replyCommentID = ref<number | string | null>(null)
const isMobile = useMediaQuery('(max-width: 768px)')

const isReplyingTo = (id: number | string) => replyCommentID.value === id
function toggleCommentReply(id: number | string) {
  replyCommentID.value = replyCommentID.value === id ? null : id
}
const renderComments = computed(() => {
  return [...userSubmittedComment.value, ...comments.value]
})

async function init() {
  if (import.meta.env.SSR || noComment.value)
    return null

  await initComments(topicId, repo, commentCount)

  useInfiniteScroll(
    window,
    () => {
      loadMoreComment()
    },
    {
      distance: 10,
      interval: 1500,
      canLoadMore: () => canLoadMoreComment.value,
    },
  )
}

const commentInputBox = useTemplateRef('commentInputBox')
const commentInputBoxIsVisible = ref(true)
const { right, left, width } = useElementBounding(commentArea)
const [CommentAreaCommentInputBox, UseCommentAreaCommentInputBox] = createReusableTemplate()

const isClosedComment = computed(() => commentCount === -1)

onMounted(async () => {
  await init()

  if (comments.value.length < 5)
    return

  useIntersectionObserver(
    commentInputBox,
    ([entry]) => {
      commentInputBoxIsVisible.value = entry?.isIntersecting || false
    },
  )
},
)

onUnmounted(() => {
  userSubmittedComment.value = []
})

function handleCommentSubmit(submittedComment: Ref<ForumAPI.Comment>) {
  return submitComment(submittedComment)
}

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
