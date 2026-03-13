<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumViewMode } from '~/composables/useForumViewMode'
import ForumTopicReactionButton from './ForumTopicReactionButton.vue'
import ForumTopicTypeBadge from './ui/ForumTopicTypeBadge.vue'

const { topicData } = defineProps<{
  topicData: ForumAPI.Topic
}>()

const emit = defineEmits(['comment:click'])

const { message } = useLocalized()
const { isCompactMode } = useForumViewMode()

const isClosedComment = computed(() => topicData.commentCount === -1)
const displayText = computed(() => {
  if (isClosedComment.value)
    return message.value.forum.comment.commentsClosed
  if (topicData.commentCount > 0)
    return topicData.commentCount
  return message.value.forum.comment.comment
})

function handleCommentClick() {
  emit('comment:click', topicData.user)
}
</script>

<template>
  <div class="font-size-3 mr-2 flex w-full justify-between">
    <div class="topic-info-list flex cursor-default items-center">
      <ForumTopicReactionButton class="mr-2 important:h-32px" :topic-id="String(topicData.id)" />
      <Button
        variant="outline"
        :disabled="isClosedComment"
        :class="{ 'cursor-default': isClosedComment, 'important:bg-transparent': isClosedComment }"
        class="rounded-full bg-[--vp-c-bg-alt] important:h-32px"
        @click="handleCommentClick"
      >
        <span class="i-lucide:message-circle icon-btn" />
        {{ displayText }}
      </Button>
    </div>
    <ForumTopicTypeBadge v-if="isCompactMode" :type="topicData.type" />
  </div>
</template>
