<template>
  <div class="flex justify-between font-size-3 mr-2">
    <ForumDate
      class="font-[var(--vp-font-family-subtitle)] color-[--vp-c-text-3] lh-[36px]"
      :date="topicData.createdAt"
    />

    <div class="topic-info-list flex items-center cursor-default">
      <ForumTopicDropdownMenu
        class="opacity-0"
        :topicData="topicData"
        @topic:close="handleTopicClose"
        @topic:hide="handleTopicHide"
      />

      <Button
        variant="ghost"
        :disabled="isClosedComment"
        :class="{ 'cursor-default': isClosedComment }"
        @click="handleCommentClick"
      >
        <span class="i-lucide:message-circle icon-btn"></span>
        {{ displayText }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumData } from '~/stores/useForumData'
import ForumTopicDropdownMenu from './ForumTopicDropdownMenu.vue'
import ForumDate from './ForumDate.vue'

import type ForumAPI from '@/apis/forum/api'

const { message } = useLocalized()

const { topicData, commentId } = defineProps<{
  topicData: ForumAPI.Topic
  commentId: number
}>()

const emit = defineEmits(['comment:click'])

const { removeTopic } = useForumData()

const isClosedComment = computed(() => commentId === -1)
const displayText = computed(() => {
  if (isClosedComment.value) return message.value.forum.comment.commentsClosed
  if (topicData.commentCount === -1) return message.value.forum.comment.reply
  if (topicData.commentCount > 0) return topicData.commentCount
  return message.value.forum.comment.comment
})

const handleTopicClose = () => {
  removeTopic(topicData.id)
}

const handleTopicHide = () => {
  removeTopic(topicData.id)
}

const handleCommentClick = () => {
  emit('comment:click', topicData.user)
}
</script>
