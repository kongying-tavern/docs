<script setup lang="ts">
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import { useClipboard } from '@vueuse/core'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
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
import { useForumRoute } from '~/composables/useForumRoute'
import { useRuleChecks } from '~/composables/useRuleChecks'
import ForumTime from '../ui/ForumTime.vue'
import ForumTopicCommentDropdownMenu from './ForumTopicCommentDropdownMenu.vue'

const {
  commentData,
  commentCount = 0,
  commentClickHandler = () => {},
  repo = 'Feedback',
  topicId,
  commentPage = 1,
} = defineProps<{
  repo?: string
  commentCount?: number
  commentData: ForumAPI.Comment
  commentClickHandler?: (event: Event) => void
  menus?: FORUM.TopicDropdownMenu[]
  topicId?: string
  commentPage?: number
}>()

const emit = defineEmits(['comment:delete', 'comment:click'])

const { message } = useLocalized()
const forumMutations = useForumMutations()
const { commentHref } = useForumRoute()
const { isSupported: clipboardSupported } = useClipboard()
const { hasAnyPermissions } = useRuleChecks(commentData.author.id)
const canDelete = hasAnyPermissions('manage_feedback', 'edit_feedback')
const deleteDialogOpen = ref(false)
const copyMenu = computed<FORUM.TopicDropdownMenu[]>(() => clipboardSupported.value && topicId
  ? [{
      type: 'item',
      id: 'copy-comment-link',
      label: message.value.forum.topic.menu.copyLink.text,
      icon: 'i-lucide:link',
      action: async () => {
        try {
          await navigator.clipboard.writeText(new URL(commentHref(topicId, commentData.id, commentPage), location.href).href)
          toast.success(message.value.forum.topic.menu.copyLink.success)
        }
        catch {
          toast.error(message.value.forum.topic.menu.copyLink.fail)
        }
      },
    }]
  : [])
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
      <ForumTopicCommentDropdownMenu :menus="[...(menus ?? []), ...copyMenu, ...deleteMenu]" />

      <Button type="button" class="h-8 max-mobile:h-11" variant="ghost" @click="handleCommentClick">
        <span class="i-lucide:message-circle icon-btn max-mobile:size-6" aria-hidden="true" />
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
