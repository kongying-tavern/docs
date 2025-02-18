<template>
  <div class="pb-24">
    <p
      id="reply"
      class="mb-5.5 line-height-[21px] font-size-5 font-[var(--vp-font-family-subtitle)]"
    >
      {{ message.forum.comment.commentCount }}
      <span class="font-size-3.5 vertical-text-top color-[var(--vp-c-text-3)]">
        {{ allCommentCount }}
      </span>
    </p>
    <ForumCommentInputBox
      :repo="repo"
      :placeholder="message.forum.comment.placeholder"
      :topic-id="topicId"
      @comment:submit="handleCommentSubmit"
    />
    <div class="comment-list slide-enter mt-8">
      <ForumTopicComment
        v-for="comment in renderComments"
        :repo="repo"
        :id="'reply-' + comment.id"
        :key="comment.id"
        :topic-author-id="topicAuthorId"
        :topic-id="topicId"
        :commentData="comment"
        :comment-click-handler="() => toggleCommentReply(comment.id)"
      >
        <ForumCommentInputBox
          class="mt-4"
          v-if="isReplyingTo(comment.id)"
          :repo="repo"
          :topic-id="topicId"
          :reply-target="comment.author.login"
          :placeholder="`${message.forum.comment.reply} @${comment.author.username}：`"
          @comment:submit="handleCommentSubmit"
        />
      </ForumTopicComment>

      <ForumLoadState :loading="commentLoading" :text="loadStateMessage" />
    </div>
    <Separator
      v-if="currentCommentPage === 1 && commentLoading"
      class="inline-block w-full my-8 text-center c-[var(--vp-c-text-3)] font-size-3"
      :label="message.forum.comment.loadingComment"
    >
    </Separator>
  </div>
</template>

<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { type Ref, computed, nextTick, onMounted, ref } from 'vue'
import ForumCommentInputBox from './ForumCommentInputBox.vue'
import ForumTopicComment from './ForumTopicComment.vue'
import ForumLoadState from './ForumLoadState.vue'
import { scrollTo } from '~/composables/scrollTo'
import { useInfiniteScroll, watchOnce } from '@vueuse/core'
import { useTopicComments } from '~/composables/useTopicComment'

const {
  repo,
  topicId,
  topicAuthorId,
  commentCount = null,
} = defineProps<{
  repo: 'Feedback' | 'Blog'
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

const replyCommentID = ref<number | string | null>(null)

const isReplyingTo = (id: number | string) => replyCommentID.value === id
const toggleCommentReply = (id: number | string) => {
  replyCommentID.value = replyCommentID.value === id ? null : id
}
const renderComments = computed(() => {
  return [...userSubmittedComment.value, ...comments.value]
})

const init = async () => {
  if (import.meta.env.SSR || noComment.value) return null

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

onMounted(async () => {
  await init()
})

const handleCommentSubmit = (submittedComment: Ref<ForumAPI.Comment>) =>
  submitComment(submittedComment)

watchOnce(commentLoading, async () => {
  await nextTick()

  scrollTo()
})
</script>

<style>
.comment-list.forum-topic-item:hover
  > .topic-info
  > div
  > .topic-info-list
  > .topic-btn-more {
  opacity: 1 !important;
}
</style>
