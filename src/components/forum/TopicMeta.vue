<template>
  <div class="flex justify-between font-size-3 mr-2">
    <time :datetime="createdAt" class="color-[--vp-c-text-3]">
      {{ formatDate(createdAt, localeIndex) }}
    </time>

    <div class="topic-info-list">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            ariant="ghost"
            size="icon"
            class="topic-btn-more important:clear-bg align-mid h-auto opacity-0"
          >
            <span class="i-custom-ellipsis-vertical icon-btn"></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" class="w-23">
          <DropdownMenuItem @click="issues.openTopicOnGitee(topicId)">
            <span class="i-lucide:link"></span>
            <span>{{ theme.forum.topic.menu.giteeLink }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="!commentId && hasPermission"
            @click="hideTopic()"
          >
            <span class="i-lucide:eye-off icon-btn"></span>
            <span>{{ theme.forum.topic.menu.hideFeedback.text }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="commentId && hasPermission"
            @click="deleteComment()"
          >
            <span class="i-lucide:trash-2 icon-btn"></span>
            <span>{{ theme.forum.topic.menu.deleteComment.text }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="!commentId && hasPermission"
            @click="closeTopic()"
          >
            <span class="i-lucide:trash-2 icon-btn"></span>
            <span>{{ theme.forum.topic.menu.closeFeedback.text }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <component
        class="avatar-image"
        :is="commentClickHandler ? 'button' : 'a'"
        @click="commentClickHandler"
        :href="isHandler ? '' : topicLink"
        target="_black"
      >
        <span class="i-lucide:message-circle icon-btn"></span>
        {{ str }}
      </component>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from './utils'
import { useData, withBase } from 'vitepress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { issues } from '@/apis/forum/gitee'
import { useUserAuthStore, useUserInfoStore } from '@/stores'
import { toast } from 'vue-sonner'
import type ForumAPI from '@/apis/forum/api'

const { localeIndex, theme } = useData()

const userAuth = useUserAuthStore()
const userInfo = useUserInfoStore()

const props = defineProps<{
  createdAt: string
  topicId: string | number
  tags?: ForumAPI.TopicTags
  commentCount?: number
  commentId?: number | string
  authorId?: number | string
  commentClickHandler?: () => void
}>()

const hasPermission = computed(
  () => userInfo.isTeamMember() || userInfo?.info?.id === props.authorId,
)
const isHandler = computed(
  () => typeof props.commentClickHandler === 'function',
)
const topicLink = computed(() =>
  withBase(`/feedback/topic?number=${props.topicId}#reply`),
)
const str = computed(() => {
  if (props.commentCount && props.commentCount > 0) return props.commentCount
  return theme.value.forum.comment.comment
})

const hideTopic = async () => {
  if (!props.tags) return
  const data = await issues.putTopic(userAuth.accessToken, props.topicId!, {
    labels: props.tags.filter((val) => val !== 'good-issue').join(','),
  })
  if (data)
    return toast.success(theme.value.forum.topic.menu.hideFeedback.success)
  toast.error(theme.value.forum.topic.menu.hideFeedback.fail)
}

const deleteComment = async () => {
  const data = await issues.deleteIssueComment(
    userAuth.accessToken,
    props.commentId!,
  )
  if (data)
    return toast.success(theme.value.forum.topic.menu.deleteComment.success)
  toast.error(theme.value.forum.topic.menu.deleteComment.fail)
}

const closeTopic = async () => {
  const data = await issues.putTopic(userAuth.accessToken, props.topicId, {
    state: 'closed',
  })
  if (data)
    return toast.success(theme.value.forum.topic.menu.closeFeedback.success)
  toast.error(theme.value.forum.topic.menu.closeFeedback.fail)
}
</script>
