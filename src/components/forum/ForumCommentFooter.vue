<template>
  <div class="flex justify-between font-size-3 mr-2">
    <ForumDate
      class="font-[var(--vp-font-family-subtitle)] color-[--vp-c-text-3] lh-[36px]"
      :date="commentData.createdAt"
    />

    <div class="topic-info-list flex items-center cursor-default">
      <ForumTopicCommentDropdownMenu :repo="repo" :commentData="commentData" />

      <Button variant="ghost" @click="handleCommentClick">
        <span class="i-lucide:message-circle icon-btn"></span>
        {{ commentMsg }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import ForumTopicCommentDropdownMenu from './ForumTopicCommentDropdownMenu.vue'
import { useLocalized } from '@/hooks/useLocalized'
import ForumDate from './ForumDate.vue'
import type ForumAPI from '@/apis/forum/api'

const emit = defineEmits(['comment:delete', 'comment:click'])

const { message } = useLocalized()

const {
  commentData,
  commentCount = 0,
  commentClickHandler = () => {},
} = defineProps<{
  repo: string
  commentCount?: number
  commentData: ForumAPI.Comment
  commentClickHandler?: Function
}>()

const commentMsg = computed(() => {
  if (commentCount > 0) return commentCount
  return message.value.forum.comment.reply
})

const handleCommentClick = (event: Event) => {
  commentClickHandler(event)
  emit('comment:click', commentData.author)
}
</script>
