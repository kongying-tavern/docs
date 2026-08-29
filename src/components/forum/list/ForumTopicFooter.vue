<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumViewMode } from '~/composables/useForumViewMode'
import ForumTopicReactionButton from '../ui/ForumTopicReactionButton.vue'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'

const { topicData } = defineProps<{
  topicData: ForumAPI.Topic
}>()

const emit = defineEmits<{
  'comment:click': [user: ForumAPI.User]
}>()

const { message } = useLocalized()
const { isCompactMode } = useForumViewMode()
const reactionTarget = ref<HTMLElement | null>(null)
const reactionEnabled = ref(false)

const { stop: stopReactionObserver } = useIntersectionObserver(reactionTarget, ([entry]) => {
  if (!entry?.isIntersecting)
    return
  reactionEnabled.value = true
  stopReactionObserver()
})

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
    <div class="topic-info-list flex gap-2 cursor-default items-center">
      <div ref="reactionTarget" @focusin="reactionEnabled = true">
        <ForumTopicReactionButton :topic-id="topicData.id" :autoload="reactionEnabled" />
      </div>
      <Button
        type="button"
        variant="outline"
        data-action="comment"
        :disabled="isClosedComment"
        :class="{ 'cursor-default': isClosedComment, 'important:bg-transparent': isClosedComment }"
        class="rounded-full bg-[--vp-c-bg-alt] important:h-32px max-mobile:important:h-44px"
        @click="handleCommentClick"
      >
        <span class="i-lucide:message-circle icon-btn max-mobile:size-6" />
        {{ displayText }}
      </Button>
    </div>
    <ForumTopicTypeBadge v-if="isCompactMode" :type="topicData.type" />
  </div>
</template>
