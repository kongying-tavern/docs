<template>
  <div class="flex justify-between font-size-3 mr-2">
    <time :datetime="createdAt" class="color-[--vp-c-text-3] lh-[36px]">
      {{ formattedDate }}
    </time>

    <div class="topic-info-list flex items-center cursor-default">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="topic-btn-more important:clear-bg align-mid h-auto opacity-0"
          >
            <span class="i-custom-ellipsis-vertical icon-btn"></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" class="w-23">
          <DropdownMenuItem @click="handleCommentClick">
            <span class="i-lucide:link"></span>
            <span>{{ menuLabels.toOriginal }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="hasPermission(authorId)"
            @click="handleDeleteComment"
          >
            <span class="i-lucide:trash-2 icon-btn"></span>
            <span>{{ menuLabels.deleteComment.text }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" @click="handleCommentClick">
        <span class="i-lucide:message-circle icon-btn"></span>
        {{ displayText }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useForumData } from '~/stores/useForumData'
import { useLocalized } from '@/hooks/useLocalized'
import { hasPermission } from '~/composables/hasPermission'

const { message, formatDate } = useLocalized()
const menuLabels = ref(message.value.forum.topic.menu)

const { deleteComment } = useForumData()

const {
  createdAt,
  authorId,
  commentCount = 0,
  commentId,
  commentClickHandler,
} = defineProps<{
  createdAt: string
  commentCount?: number
  commentId: number | string
  authorId: number | string
  commentClickHandler: Function
}>()

const displayText = computed(() => {
  if (commentCount > 0) return commentCount
  return message.value.forum.comment.reply
})

const formattedDate = computed(() => formatDate(createdAt || '1980-1-1'))
const handleDeleteComment = () => deleteComment(commentId)
const handleCommentClick = (event: Event) => commentClickHandler(event)
</script>
