<template>
  <div class="pb-24">
    <p id="reply" class="mb-5.5 line-height-[21px] font-size-5">
      {{ theme.forum.comment.commentCount }}
      <span class="font-size-3.5 vertical-text-top color-[var(--vp-c-text-3)]">
        {{ allCommentCount }}
      </span>
    </p>
    <ForumCommentInputBox
      :placeholder="theme.forum.comment.placeholder"
      :number="topicId"
      @comment:submit="handleCommentSubmit"
    />
    <div class="comment-list slide-enter mt-8">
      <ForumTopicComment
        v-for="comment in [...userSubmittedComment, ...data]"
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
          :placeholder="`${theme.forum.comment.reply} @${comment.author.username}：`"
          @comment:submit="handleCommentSubmit"
        />
      </ForumTopicComment>
      <Button
        class="vp-link flex w-full m-6"
        variant="link"
        :disabled="loading"
        @click="loadMore"
        v-if="!noMore && data.length !== 0"
      >
        <ReloadIcon
          class="w-4 h-4 mr-2"
          :class="loading ? 'animate-spin' : ''"
        />
        {{ theme.forum.comment.loadMoreComment }}
      </Button>
      <p
        v-else-if="!loading"
        class="inline-block w-full my-8 text-center c-[var(--vp-c-text-3)] font-size-3"
      >
        {{
          data.length === 0
            ? theme.forum.comment.noCommnet
            : theme.forum.comment.noMoreComment
        }}
      </p>
    </div>
    <Separator
      v-if="current === 1 && loading"
      class="inline-block w-full my-8 text-center c-[var(--vp-c-text-3)] font-size-3"
      :label="theme.forum.comment.loadingComment"
    >
    </Separator>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Ref } from 'vue'
import { ReloadIcon } from '@radix-icons/vue'
import { issues } from '@/apis/forum/gitee'
import { Button } from '@/components/ui/button'
import Separator from '@/components/ui/separator/Separator.vue'
import ForumTopicComment from '../ForumTopicComment.vue'
import ForumCommentInputBox from '../ForumCommentInputBox.vue'
import { useData } from 'vitepress'
import { useLoadMore } from '../../../composables/useLoadMore'
import type ForumAPI from '@/apis/forum/api'

const props = defineProps<{
  topicId: string
  topicAuthorId: string | number
}>()

const { theme } = useData()

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
