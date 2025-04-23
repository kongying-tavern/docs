<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from './types'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { computed } from 'vue'
import ForumTopicReactionButton from './ForumTopicReactionButton.vue'
import ForumTopicTypeBadge from './ForumTopicTypeBadge.vue'

const { topicData } = defineProps<{
  topicData: ForumAPI.Topic
  viewMode: FORUM.TopicViewMode
}>()

const emit = defineEmits(['comment:click'])

const { message } = useLocalized()

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
  <div class="mr-2 w-full flex justify-between font-size-3">
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

    <ForumTopicTypeBadge v-if="viewMode === 'Compact'" :type="topicData.type" />
  </div>
</template>
