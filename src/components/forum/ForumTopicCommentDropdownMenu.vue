<template>
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
    <DropdownMenuContent side="top" class="text-nowrap">
      <DropdownMenuItem
        v-if="isSupported"
        @click="copy(commentData.content.text)"
      >
        <span class="i-lucide:clipboard icon-btn mr-2"></span>
        <span v-if="!copied">复制评论</span>
        <span v-else>{{ menuLabels.copyLink.success }}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="hasEditPermission" />
      <DropdownMenuItem
        class="c-red opacity-90 hover:c-red hover:opacity-100"
        v-if="hasEditPermission"
        @click="handleDeleteComment"
      >
        <span class="i-lucide:trash-2 icon-btn mr-2"></span>
        <span>{{ menuLabels.deleteComment.text }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTopicComments } from '~/composables/useTopicComment'
import { useClipboard } from '@vueuse/core'

import type ForumAPI from '@/apis/forum/api'

const emit = defineEmits(['comment:delete'])

const { deleteComment } = useTopicComments()
const { message } = useLocalized()

const { commentData, repo = 'Feedback' } = defineProps<{
  repo: string
  commentData: ForumAPI.Comment
}>()

const { copy, copied, isSupported } = useClipboard()
const { hasAnyPermissions } = useRuleChecks(commentData.author.id)

const hasEditPermission = hasAnyPermissions('manage_feedback', 'edit_feedback')

const menuLabels = ref(message.value.forum.topic.menu)

const handleDeleteComment = async () => {
  await deleteComment(repo, commentData.id)

  emit('comment:delete', commentData.id)
}
</script>
