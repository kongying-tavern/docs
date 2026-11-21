<script setup lang="ts">
import type ForumAPI from '@/src/forum/api/types.d.ts'
import { useMediaQuery } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { GiteeAPIError } from '@/src/forum/api/gitee/index.ts'
import { useForumRoute } from '@/src/forum/composables/state/useForumRoute.ts'
import { collectMentionUsers } from '@/src/forum/services/commentComposer.ts'
import { FORUM_MOBILE_MEDIA_QUERY } from '@/src/forum/services/forumConfig.ts'
import { useCommentAreaState } from './composables/useCommentAreaState.ts'
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
const { t } = useI18n({ useScope: 'global' })
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
const mobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const input = useTemplateRef<InstanceType<typeof ForumCommentInputBox>>('input')
const replyUser = ref<ForumAPI.User>()
const editorOpen = ref(false)
const mentionUsers = computed(() => collectMentionUsers(replyUser.value ? [replyUser.value] : [], props.topic ? [props.topic.user] : [], renderComments.value.map(comment => comment.author)))
function reply(id: string | number): void {
  if (!mobile.value) {
    toggleCommentReply(id)
    return
  }
  if (input.value?.pending)
    return
  replyUser.value = renderComments.value.find(comment => String(comment.id) === String(id))?.author
  input.value?.open()
}
function submitted(): void {
  replyUser.value = undefined
  handleCommentSubmit()
}
function login(): void {
  location.hash = 'login-alert'
}
</script>

<template>
  <ForumCommentPanel
    :presentation="presentation"
    :comments="renderComments"
    :comment-pages="commentPages"
    :reply-id="mobile ? null : replyCommentID"
    :editor-open="editorOpen"
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
    @reply="reply"
    @load-more="loadMoreComment"
    @retry="retry"
    @login="login"
  >
    <template #input>
      <ForumCommentInputBox ref="input" :repo="repo" :presentation="presentation" :reply-user="replyUser" :mention-users="mentionUsers" :autofocus="autofocusInput" :placeholder="t('forum.comment.placeholder')" :topic-id="topicId" :topic="topic" :entry-animation="entryAnimation" @editor-open="editorOpen = $event" @cancel-reply="replyUser = undefined" @comment:submit="submitted" />
    </template>
    <template #reply="{ comment }">
      <ForumCommentInputBox
        :repo="repo"
        :topic-id="topicId"
        :topic="topic"
        :reply-target="comment.author.login"
        :placeholder="`${t('forum.comment.reply')} @${comment.author.username}：`"
        :entry-animation="entryAnimation"
        @comment:submit="handleCommentSubmit"
      />
    </template>
  </ForumCommentPanel>
</template>
