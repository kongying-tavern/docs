<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from './types'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { computed } from 'vue'

import { defineTopicDropdownMenu } from '~/composables/defineTopicDropdownMenu'
import ForumDate from './ForumDate.vue'
import ForumTopicDropdownMenu from './ForumTopicDropdownMenu.vue'

const { topicData, commentId, menu } = defineProps<{
  topicData: ForumAPI.Topic
  commentId: number
  menu?: FORUM.TopicDropdownMenu[]
}>()

const emit = defineEmits(['comment:click'])

const { message } = useLocalized()

const dropdownMenu = defineTopicDropdownMenu(topicData)

const isClosedComment = computed(() => commentId === -1)
const displayText = computed(() => {
  if (isClosedComment.value)
    return message.value.forum.comment.commentsClosed
  if (topicData.commentCount === -1)
    return message.value.forum.comment.reply
  if (topicData.commentCount > 0)
    return topicData.commentCount
  return message.value.forum.comment.comment
})

function handleCommentClick() {
  emit('comment:click', topicData.user)
}
</script>

<template>
  <div class="mr-2 flex justify-between font-size-3">
    <ForumDate
      class="color-[--vp-c-text-3] lh-[36px] font-[var(--vp-font-family-subtitle)]"
      :date="topicData.createdAt"
    />

    <div class="topic-info-list flex cursor-default items-center">
      <ForumTopicDropdownMenu
        class="opacity-0"
        :topic-data="topicData"
        :menu="[...(menu ?? []), ...dropdownMenu]"
      />

      <Button
        variant="ghost"
        :disabled="isClosedComment"
        :class="{ 'cursor-default': isClosedComment }"
        @click="handleCommentClick"
      >
        <span class="i-lucide:message-circle icon-btn" />
        {{ displayText }}
      </Button>
    </div>
  </div>
</template>
