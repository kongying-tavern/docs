<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumViewMode } from '~/forum/composables/state/useForumViewMode'
import ForumQuoteTopicButton from '../topic/ForumQuoteTopicButton.vue'
import ForumTopicMetadataControl from '../topic/ForumTopicMetadataControl.vue'
import ForumTopicReactionButton from '../ui/ForumTopicReactionButton.vue'

const { topicData } = defineProps<{
  topicData: ForumAPI.Topic
  /** 预览窗口等自带评论输入框的场景下隐藏评论按钮 */
  hideCommentButton?: boolean
}>()

const emit = defineEmits<{
  'comment:click': [user: ForumAPI.User]
}>()

const { message } = useLocalized()
const { isCompactMode } = useForumViewMode(() => topicData.type)
const reactionTarget = useTemplateRef<HTMLElement>('reactionTarget')
const reactionEnabled = ref(false)

const { stop: stopReactionObserver } = useIntersectionObserver(reactionTarget, ([entry]) => {
  if (!entry?.isIntersecting)
    return
  reactionEnabled.value = true
  stopReactionObserver()
})

const isClosedComment = computed(() => topicData.commentCount === -1)
const displayText = computed(() => {
  if (isClosedComment.value)
    return message.value.forum.comment.commentsClosed
  if (topicData.commentCount > 0)
    return topicData.commentCount
  return message.value.forum.comment.comment
})
// 有评论时可见文本是裸数字，读屏需要带上下文的名称
const commentAriaLabel = computed(() => {
  if (isClosedComment.value)
    return message.value.forum.comment.commentsClosed
  if (topicData.commentCount > 0)
    return `${message.value.forum.comment.comment} ${topicData.commentCount}`
  return message.value.forum.comment.comment
})

function handleCommentClick() {
  emit('comment:click', topicData.user)
}
</script>

<template>
  <div class="font-size-3 mr-2 flex w-full justify-between">
    <div class="topic-info-list flex gap-3 cursor-default items-center">
      <div v-if="topicData.type !== 'ANN'" ref="reactionTarget" @focusin="reactionEnabled = true">
        <ForumTopicReactionButton :topic-id="topicData.id" :autoload="reactionEnabled" />
      </div>
      <Button
        v-if="!hideCommentButton"
        type="button"
        variant="ghost"
        size="sm"
        data-action="comment"
        :disabled="isClosedComment"
        :aria-label="commentAriaLabel"
        class="rounded-full bg-[var(--vp-c-bg-alt)] h-8 tabular-nums max-mobile:h-9"
        @click="handleCommentClick"
      >
        <span class="i-lucide-message-circle h-5 w-5" aria-hidden="true" />
        {{ displayText }}
      </Button>
      <ForumQuoteTopicButton :topic="topicData" :autoload="reactionEnabled" />
    </div>
    <ForumTopicMetadataControl
      v-if="isCompactMode"
      :topic="topicData"
      data-forum-shared-topic="type"
      :type="topicData.type"
      :topic-id="topicData.id"
      :state="topicData.state"
      :status="topicData.status"
      :good-issue="topicData.goodIssue"
      interactive
    />
  </div>
</template>
