<template>
  <div class="pb-24">
    <p id="reply" class="mb-5.5 line-height-[21px] font-size-5">
      {{ message.forum.comment.commentCount }}
      <span class="font-size-3.5 vertical-text-top color-[var(--vp-c-text-3)]">
        {{ allCommentCount }}
      </span>
    </p>
    <ForumCommentInputBox
      :placeholder="message.forum.comment.placeholder"
      :number="topicId"
      @comment:submit="handleCommentSubmit"
    />
    <div class="comment-list slide-enter mt-8">
      <ForumTopicComment
        v-for="comment in [...userSubmittedComment, ...data]"
        :id="'reply-' + comment.id"
        :key="comment.id"
        :comment-id="comment.id"
        :created-at="comment.createdAt"
        :topic-author-id="topicAuthorId"
        :topic-id="topicId"
        :body="comment.content"
        :author="comment.author"
        :comment-click-handler="() => toggleCommentReply(comment.id)"
      >
        <ForumCommentInputBox
          class="mt-4"
          v-if="isReplyingTo(comment.id)"
          :number="topicId"
          :reply="`@${comment.author.login}`"
          :placeholder="`${message.forum.comment.reply} @${comment.author.username}：`"
          @comment:submit="handleCommentSubmit"
        />
      </ForumTopicComment>

      <ForumLoadState :loading="loading" :text="loadStateMessage" />
    </div>
    <Separator
      v-if="current === 1 && loading"
      class="inline-block w-full my-8 text-center c-[var(--vp-c-text-3)] font-size-3"
      :label="message.forum.comment.loadingComment"
    >
    </Separator>
  </div>
</template>

<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { issues } from '@/apis/forum/gitee'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { type Ref, computed, ref } from 'vue'
import { useLoadMore } from '@/hooks/useLoadMore'
import ForumCommentInputBox from '../ForumCommentInputBox.vue'
import ForumTopicComment from '../ForumTopicComment.vue'
import ForumLoadState from '../ForumLoadState.vue'
import { useScrollToHash } from '~/composables/useScrollToHash'

const props = defineProps<{
  topicId: string
  topicAuthorId: string | number
}>()

const { message } = useLocalized()

useScrollToHash({
  offset: 20,
})

const userSubmittedComment = ref<ForumAPI.Comment[]>([])
const replyCommentID = ref<number | string | null>(null)
const allCommentCount = computed(
  () => total.value + userSubmittedComment.value.length,
)

const isReplyingTo = (id: number | string) => replyCommentID.value === id
const toggleCommentReply = (id: number | string) => {
  replyCommentID.value = replyCommentID.value === id ? null : id
}

const {
  loadMore,
  data,
  noMore,
  unshiftData,
  loading,
  loadingMore,
  total,
  totalPage,
  current,
  pageSize,
} = useLoadMore(issues.getTopicComments, {
  defaultParams: [{ current: 1, pageSize: 20, sort: 'created' }, props.topicId],
})

const handleCommentSubmit = (submittedComment: Ref<ForumAPI.Comment>) => {
  if (!submittedComment.value) return
  userSubmittedComment.value.push(submittedComment.value)
}

const loadStateMessage = computed(() => {
  if (!noMore && data.value.length !== 0)
    return message.value.forum.comment.loadMoreComment
  if (data.value.length === 0 && !loading.value)
    return message.value.forum.comment.noComment
  return message.value.forum.comment.noMoreComment
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
