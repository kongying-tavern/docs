<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocalized } from '@/hooks/useLocalized'
import { useClipboard } from '@vueuse/core'
import { ref } from 'vue'

import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTopicComments } from '~/composables/useTopicComment'

const { commentData, repo = 'Feedback' } = defineProps<{
  repo: string
  commentData: ForumAPI.Comment
}>()

const emit = defineEmits(['comment:delete'])

const { deleteComment } = useTopicComments()
const { message } = useLocalized()

const { copy, copied, isSupported } = useClipboard()
const { hasAnyPermissions } = useRuleChecks(commentData.author.id)

const hasEditPermission = hasAnyPermissions('manage_feedback', 'edit_feedback')

const menuLabels = ref(message.value.forum.topic.menu)

async function handleDeleteComment() {
  await deleteComment(repo, commentData.id)

  emit('comment:delete', commentData.id)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="topic-btn-more h-auto align-mid opacity-0 important:clear-bg"
      >
        <span class="i-custom-ellipsis-vertical icon-btn" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="top" class="text-nowrap">
      <DropdownMenuItem
        v-if="isSupported"
        @click="copy(commentData.content.text)"
      >
        <span class="i-lucide:clipboard mr-2 icon-btn" />
        <span v-if="!copied">复制评论</span>
        <span v-else>{{ menuLabels.copyLink.success }}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="hasEditPermission" />
      <DropdownMenuItem
        v-if="hasEditPermission"
        class="c-red opacity-90 hover:c-red hover:opacity-100"
        @click="handleDeleteComment"
      >
        <span class="i-lucide:trash-2 mr-2 icon-btn" />
        <span>{{ menuLabels.deleteComment.text }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
