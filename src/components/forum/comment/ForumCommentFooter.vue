<script setup lang="ts">
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import { computed, ref } from 'vue'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { executeWithAuth } from '~/composables/executeWithAuth'
import { useForumMutations } from '~/composables/forum/useForumMutations'
import { useRuleChecks } from '~/composables/useRuleChecks'
import ForumTime from '../ui/ForumTime.vue'
import ForumTopicCommentDropdownMenu from './ForumTopicCommentDropdownMenu.vue'

const {
  commentData,
  commentCount = 0,
  commentClickHandler = () => {},
  repo = 'Feedback',
  topicId,
} = defineProps<{
  repo?: string
  commentCount?: number
  commentData: ForumAPI.Comment
  commentClickHandler?: (event: Event) => void
  menus?: FORUM.TopicDropdownMenu[]
  topicId?: string
}>()

const emit = defineEmits(['comment:delete', 'comment:click'])

const { message } = useLocalized()
const forumMutations = useForumMutations()
const { hasAnyPermissions } = useRuleChecks(commentData.author.id)
const canDelete = hasAnyPermissions('manage_feedback', 'edit_feedback')
const deleteDialogOpen = ref(false)
const deleteMenu = computed<FORUM.TopicDropdownMenu[]>(() => canDelete.value
  ? [{
      type: 'item',
      id: 'delete-comment',
      label: message.value.forum.topic.menu.deleteComment.text,
      icon: 'i-lucide:trash-2',
      class: 'c-red opacity-90 hover:c-red hover:opacity-100',
      disabled: forumMutations.deletingComment.value,
      action: () => deleteDialogOpen.value = true,
    }]
  : [])

const commentMsg = computed(() => {
  if (commentCount > 0)
    return commentCount
  return message.value.forum.comment.reply
})

function handleCommentClick(event: Event) {
  commentClickHandler(event)
  emit('comment:click', commentData.author)
}

async function handleDeleteComment() {
  const deleted = await executeWithAuth(
    forumMutations.deleteComment,
    [{ commentId: commentData.id, repo, topicId: topicId || 'unknown' }],
    message.value.forum.topic.menu.deleteComment.fail,
    message,
  )
  if (deleted)
    deleteDialogOpen.value = false
}
</script>

<template>
  <div class="font-size-3 mr-2 flex justify-between">
    <ForumTime
      class="color-[--vp-c-text-3] lh-[36px] font-[var(--vp-font-family-subtitle)]"
      :date="commentData.createdAt"
    />

    <div class="topic-info-list flex cursor-default items-center">
      <ForumTopicCommentDropdownMenu :menus="[...(menus ?? []), ...deleteMenu]" />

      <Button type="button" class="h-8" variant="ghost" @click="handleCommentClick">
        <span class="i-lucide:message-circle icon-btn size-4" aria-hidden="true" />
        {{ commentMsg }}
      </Button>
    </div>

    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{ message.forum.topic.menu.deleteComment.title }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{ message.forum.topic.menu.deleteComment.confirm }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="forumMutations.deletingComment.value">
            {{ message.ui.button.cancel }}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            :disabled="forumMutations.deletingComment.value"
            @click="handleDeleteComment"
          >
            {{ forumMutations.deletingComment.value ? message.ui.button.loading : message.forum.topic.menu.deleteComment.text }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
