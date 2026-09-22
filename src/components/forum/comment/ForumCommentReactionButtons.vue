<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { TextMorph } from '@/components/ui/text-morph'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumReaction } from '~/composables/useForumReaction'

const props = withDefaults(defineProps<{
  topicId: string
  commentId: string
  autoload?: boolean
}>(), { autoload: true })

const { message } = useLocalized()
const {
  data,
  error,
  isLoading,
  refetch,
  setReactionState,
  reactionSubmitLoading,
} = useForumReaction(() => ({ topicId: props.topicId, commentId: props.commentId }), () => props.autoload)

const disabled = computed(() => !data.value || reactionSubmitLoading.value)
const loadFailed = computed(() => Boolean(error.value) && !data.value)
</script>

<template>
  <div class="flex gap-1 items-center" role="group" :aria-label="message.forum.reaction.label">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      class="text-xs text-[var(--vp-c-text-2)] leading-none px-2 rounded-full gap-1 h-7 hover:text-[var(--vp-c-text-2)] important:bg-transparent"
      :aria-label="message.forum.reaction.like"
      :aria-pressed="data?.state === 'like'"
      :disabled="disabled"
      @click="setReactionState('like')"
    >
      <span
        class="i-lucide-thumbs-up h-4 w-4"
        :class="{ 'text-[var(--vp-c-green-3)]': data?.state === 'like' }"
        aria-hidden="true"
      />
      <TextMorph
        v-if="data"
        :text="String(data.data.likeCount)"
        class="tabular-nums"
        aria-live="polite"
      />
      <span v-else aria-hidden="true">–</span>
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="text-xs text-[var(--vp-c-text-2)] leading-none rounded-full h-7 w-7 hover:text-[var(--vp-c-text-2)] important:bg-transparent"
      :aria-label="message.forum.reaction.dislike"
      :aria-pressed="data?.state === 'dislike'"
      :disabled="disabled"
      @click="setReactionState('dislike')"
    >
      <span
        class="i-lucide-thumbs-down h-4 w-4"
        :class="{ 'text-[var(--vp-c-red-3)]': data?.state === 'dislike' }"
        aria-hidden="true"
      />
    </Button>
    <Button
      v-if="loadFailed"
      type="button"
      variant="ghost"
      size="icon"
      class="text-xs leading-none rounded-full h-7 w-7"
      :aria-label="message.forum.auth.callback.error.retry"
      :disabled="isLoading"
      @click="refetch()"
    >
      <span class="i-lucide-rotate-ccw h-4 w-4" aria-hidden="true" />
    </Button>
  </div>
</template>
