<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from './types'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { computed } from 'vue'
import { defineCommentDropdownMenu } from '~/composables/defineCommentDropdownMenu'
import ForumTime from './ForumTime.vue'
import ForumTopicCommentDropdownMenu from './ForumTopicCommentDropdownMenu.vue'

const {
  commentData,
  commentCount = 0,
  commentClickHandler = () => {},
  repo = 'Feedback',
} = defineProps<{
  repo?: string
  commentCount?: number
  commentData: ForumAPI.Comment
  commentClickHandler?: (event: Event) => void
  menus?: FORUM.TopicDropdownMenu[]
}>()

const emit = defineEmits(['comment:delete', 'comment:click'])

const dropdownMenus = defineCommentDropdownMenu(repo, commentData)

const { message } = useLocalized()

const commentMsg = computed(() => {
  if (commentCount > 0)
    return commentCount
  return message.value.forum.comment.reply
})

function handleCommentClick(event: Event) {
  commentClickHandler(event)
  emit('comment:click', commentData.author)
}
</script>

<template>
  <div class="mr-2 flex justify-between font-size-3">
    <ForumTime
      class="color-[--vp-c-text-3] lh-[36px] font-[var(--vp-font-family-subtitle)]"
      :date="commentData.createdAt"
    />

    <div class="topic-info-list flex cursor-default items-center">
      <ForumTopicCommentDropdownMenu :menus="[...(menus ?? []), ...dropdownMenus]" />

      <Button class="h-8" variant="ghost" @click="handleCommentClick">
        <span class="i-lucide:message-circle icon-btn size-4" />
        {{ commentMsg }}
      </Button>
    </div>
  </div>
</template>
