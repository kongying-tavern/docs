<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { GiteeAPIError } from '~/forum/api/gitee'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useCommentAreaState } from './composables/useCommentAreaState'
import ForumCommentInputBox from './ForumCommentInputBox.vue'
import ForumCommentPanel from './ForumCommentPanel.vue'

const props = withDefaults(defineProps<{
  repo: ForumAPI.Repo
  topicId: string
  topicAuthorId: string | number
  inline?: boolean
  presentation?: 'page' | 'embedded' | 'inline'
  commentCount?: number
  topic?: ForumAPI.Topic
  autofocusInput?: boolean
  entryAnimation?: boolean
}>(), { entryAnimation: true })
const presentation = computed(() => props.presentation ?? (props.inline ? 'inline' : 'page'))
const { message } = useLocalized()
const {
  renderComments,
  commentPages,
  allCommentCount,
  currentCommentPage,
  targetCommentId,
  targetCommentReady,
  targetCommentState,
  loadStateMessage,
  commentLoading,
  commentError,
  isClosedComment,
  replyCommentID,
  toggleCommentReply,
  handleCommentSubmit,
  retry,
  loadMoreComment,
  canLoadMoreComment,
} = useCommentAreaState({
  get repo() { return props.repo },
  get topicId() { return props.topicId },
  get topicAuthorId() { return props.topicAuthorId },
  get commentCount() { return props.commentCount },
  get presentation() { return presentation.value },
})
const { topicHref } = useForumRoute()
function login(): void {
  location.hash = 'login-alert'
}
</script>

<template>
  <ForumCommentPanel
    :presentation="presentation"
    :comments="renderComments"
    :comment-pages="commentPages"
    :reply-id="replyCommentID"
    :repo="repo"
    :topic-id="topicId"
    :topic-author-id="topicAuthorId"
    :count="allCommentCount"
    :closed="isClosedComment"
    :loading="commentLoading"
    :error="Boolean(commentError)"
    :rate-limit="commentError instanceof GiteeAPIError && commentError.isExceededRateLimit()"
    :error-message="commentError?.message ?? ''"
    :can-load-more="canLoadMoreComment"
    :load-message="loadStateMessage"
    :initial-page="currentCommentPage === 1"
    :target-id="targetCommentId"
    :target-ready="targetCommentReady"
    :target-missing="targetCommentState === 'missing'"
    :detail-href="topicHref(topicId, 'reply')"
    :entry-animation="entryAnimation"
    @reply="toggleCommentReply"
    @load-more="loadMoreComment"
    @retry="retry"
    @login="login"
  >
    <template #input>
      <ForumCommentInputBox :repo="repo" :autofocus="autofocusInput" :placeholder="message.forum.comment.placeholder" :topic-id="topicId" :topic="topic" :entry-animation="entryAnimation" @comment:submit="handleCommentSubmit" />
    </template>
    <template #reply="{ comment }">
      <ForumCommentInputBox
        :repo="repo"
        :topic-id="topicId"
        :topic="topic"
        :reply-target="comment.author.login"
        :placeholder="`${message.forum.comment.reply} @${comment.author.username}：`"
        :entry-animation="entryAnimation"
        @comment:submit="handleCommentSubmit"
      />
    </template>
  </ForumCommentPanel>
</template>
