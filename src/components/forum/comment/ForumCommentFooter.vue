<script setup lang="ts">
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import { useClipboard, useIntersectionObserver } from '@vueuse/core'
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
import { useForumCommentMutations } from '~/composables/forum/useForumMutations'
import { useForumReactionState } from '~/composables/useForumReaction'
import { useForumRoute } from '~/composables/useForumRoute'
import { useReactionStats } from '~/composables/useReactionStats'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { toast } from '~/services/telemetry/toast'
import ForumTime from '../ui/ForumTime.vue'
import ForumCommentReactionButtons from './ForumCommentReactionButtons.vue'
import ForumTopicCommentDropdownMenu from './ForumTopicCommentDropdownMenu.vue'

const {
  commentData,
  commentClickHandler = () => {},
  repo = 'Feedback',
  topicId,
  commentPage = 1,
} = defineProps<{
  repo?: ForumAPI.Repo
  commentData: ForumAPI.Comment
  commentClickHandler?: (event: Event) => void
  menus?: FORUM.TopicDropdownMenu[]
  topicId?: string
  commentPage?: number
}>()

const emit = defineEmits<{
  'comment:click': [author: ForumAPI.User]
}>()

const { message } = useLocalized()
const forumMutations = useForumCommentMutations()
const { commentHref } = useForumRoute()
const { copy, isSupported: clipboardSupported } = useClipboard()
const { hasAnyPermissions } = useRuleChecks(commentData.author.id)
const canDelete = hasAnyPermissions('manage_feedback', 'edit_feedback')
const canViewStats = hasAnyPermissions('manage_feedback')
const { openReactionStatsDialog } = useReactionStats()
const { error: reactionQueryError } = useForumReactionState(() => ({
  topicId: topicId ?? '',
  commentId: String(commentData.id),
}))
const deleteDialogOpen = ref(false)
const copyMenu = computed<FORUM.TopicDropdownMenu[]>(() => clipboardSupported.value && topicId
  ? [{
      type: 'item',
      id: 'copy-comment-link',
      label: message.value.forum.topic.menu.copyLink.text,
      icon: 'i-lucide:link',
      action: async () => {
        try {
          await copy(new URL(commentHref(topicId, commentData.id, commentPage), location.href).href)
          toast.success(message.value.forum.topic.menu.copyLink.success)
        }
        catch {
          toast.error(message.value.forum.topic.menu.copyLink.fail, { report: false })
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
const statsMenu = computed<FORUM.TopicDropdownMenu[]>(() => canViewStats.value && topicId && !reactionQueryError.value
  ? [{
      type: 'item',
      id: 'comment-reaction-stats',
      label: message.value.forum.topic.menu.reactionStats.text,
      icon: 'i-lucide:chart-column',
      action: () => openReactionStatsDialog({ kind: 'comment', topicId, commentId: String(commentData.id) }),
    }]
  : [])

const reactionTarget = ref<HTMLElement | null>(null)
const reactionEnabled = ref(false)
const { stop: stopReactionObserver } = useIntersectionObserver(reactionTarget, ([entry]) => {
  if (!entry?.isIntersecting)
    return
  reactionEnabled.value = true
  stopReactionObserver()
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
  <div class="text-xs flex gap-2 items-center">
    <div class="flex flex-wrap gap-1 items-center">
      <ForumTime
        class="text-[var(--vp-c-text-3)] font-[var(--vp-font-family-subtitle)] mr-1"
        :date="commentData.createdAt"
      />
      <div v-if="topicId" ref="reactionTarget" @focusin="reactionEnabled = true">
        <ForumCommentReactionButtons :topic-id="topicId" :comment-id="String(commentData.id)" :autoload="reactionEnabled" />
      </div>
      <Button type="button" size="sm" class="text-xs leading-none px-2 rounded-full h-7" variant="ghost" @click="handleCommentClick">
        {{ message.forum.comment.reply }}
      </Button>
    </div>
    <div class="ml-auto flex shrink-0 items-center">
      <ForumTopicCommentDropdownMenu :menus="[...(menus ?? []), ...copyMenu, ...statsMenu, ...deleteMenu]" />
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
