<template>
  <div class="flex justify-between font-size-3 mr-2">
    <time :datetime="createdAt" class="color-[--vp-c-text-3]">
      {{ formatDate(toRef(createdAt || '1980-1-1')) }}
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
          <DropdownMenuItem @click="issues.openTopicOnGitee(topicId!)">
            <span class="i-lucide:link"></span>
            <span>{{ message.forum.topic.menu.giteeLink }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="isTopic && hasPermission"
            @click="closeTopic(topicId!)"
          >
            <span class="i-lucide:trash-2 icon-btn"></span>
            <span>{{ message.forum.topic.menu.closeFeedback.text }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem v-else @click="deleteComment(commentId)">
            <span class="i-lucide:trash-2 icon-btn"></span>
            <span>{{ message.forum.topic.menu.deleteComment.text }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <component
        :class="{ 'cursor-default': isClosedComment }"
        :is="isClosedComment ? 'span' : isHandler ? 'button' : 'a'"
        :href="!isHandler ? topicLink : ''"
        :target="topicId"
        @click="commentClickHandler"
      >
        <span class="i-lucide:message-circle icon-btn"></span>
        {{ str }}
      </component>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { issues } from '@/apis/forum/gitee'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useForumData } from '../../stores/useForumData'
import { useLocalized } from '@/hooks/useLocalized'

const { message, formatDate } = useLocalized()

const { closeTopic, deleteComment } = useForumData()

const userInfo = useUserInfoStore()

const props = defineProps({
  createdAt: String,
  topicId: [String, Number],
  commentCount: { type: Number, default: 0 },
  commentId: { type: [Number, String], default: null },
  authorId: [Number, String],
  commentClickHandler: Function,
  type: { type: String, required: true },
})

const hasPermission = computed(
  () => userInfo.isTeamMember() || userInfo?.info?.id === props.authorId,
)

const isHandler = computed(
  () => typeof props.commentClickHandler === 'function',
)
const isClosedComment = computed(() => props.commentId === -1)
const isTopic = computed(() => props.type === 'topic')

const topicLink = computed(() => {
  if (props.topicId == -1 || props.commentId == -1) return ''
  return `./topic?number=${props.topicId}#reply${props.commentId ? '-' + props.commentId : ''}`
})

const str = computed(() => {
  if (props.commentId == -1) return message.value.forum.comment.commentsClosed
  if (props.commentCount == -1) return message.value.forum.comment.reply
  if (props.commentCount > 0) return props.commentCount
  if (props.type === 'topic') return message.value.forum.comment.comment
  return message.value.forum.comment.reply
})
</script>
