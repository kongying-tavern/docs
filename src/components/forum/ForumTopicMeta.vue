<template>
  <div class="flex justify-between font-size-3 mr-2">
    <time :datetime="createdAt" class="color-[--vp-c-text-3] lh-[36px]">
      {{ formatDate(createdAt || '1980-1-1') }}
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
        <DropdownMenuContent side="top" class="text-nowrap">
          <DropdownMenuItem
            v-if="isTeamMemberOrInDevEnv"
            @click="openGiteeLink"
          >
            <span class="i-lucide:external-link icon-btn"></span>
            <span>{{ menuLabels.giteeLink }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="isSupported"
            @click="copy(getRedirectUrlText(topicId, undefined, false))"
          >
            <span class="i-lucide:clipboard icon-btn"></span>
            <span v-if="!copied">{{ menuLabels.copyLink.text }}</span>
            <span v-else>{{ menuLabels.copyLink.success }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="hasPermission(authorId)"
            @click="handleCloseTopic"
          >
            <span class="i-lucide:square-x icon-btn"></span>
            <span>{{ menuLabels.closeFeedback.text }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="isTeamMemberOrInDevEnv"
            @click="handleHideTopic"
          >
            <span class="i-lucide:eye-off icon-btn"></span>
            <span>{{ menuLabels.hideFeedback.text }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
import { computed, ref } from 'vue'
import { issues } from '@/apis/forum/gitee'
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
import { isTeamMemberOrInDevEnv } from '~/composables/isTeamMemberOrInDevEnv'
import { useClipboard } from '@vueuse/core'
import { getRedirectUrlText } from '~/composables/sessionCacheRedirect'

const { message, formatDate } = useLocalized()
const { closeTopic, hidleTopic } = useForumData()

const {
  createdAt,
  topicId,
  commentCount = 0,
  commentId,
  commentClickHandler,
} = defineProps<{
  createdAt: string
  topicId: string | number
  commentCount?: number
  commentId: number | string
  authorId: number | string
  commentClickHandler: Function
}>()

const { copy, copied, isSupported } = useClipboard()

const menuLabels = ref(message.value.forum.topic.menu)

const isClosedComment = computed(() => commentId === -1)
const displayText = computed(() => {
  if (isClosedComment.value) return message.value.forum.comment.commentsClosed
  if (commentCount === -1) return message.value.forum.comment.reply
  if (commentCount > 0) return commentCount
  return message.value.forum.comment.comment
})

const openGiteeLink = () => issues.openTopicOnGitee(topicId!)
const handleCloseTopic = () => closeTopic(topicId)
const handleHideTopic = () => hidleTopic(topicId)
const handleCommentClick = () => commentClickHandler()
</script>
