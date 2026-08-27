<script setup lang="ts">
import type { INTER_KNOT } from '@/apis/interknot.site/api'
import { ReloadIcon } from '@radix-icons/vue'
import { computed } from 'vue'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useTopicsReaction } from '~/composables/useTopicsReaction'

const props = withDefaults(defineProps<{
  topicId: string
  autoload?: boolean
}>(), {
  autoload: true,
})
const { message } = useLocalized()
const {
  data: reactionData,
  error,
  isLoading,
  refetch,
  setReactionState,
  reactionSubmitLoading,
  viewerReady,
} = useTopicsReaction(() => props.topicId, () => props.autoload)

const reactionState = computed(() => reactionData.value?.state ?? null)
const likeCount = computed(() => reactionData.value?.data.likeCount ?? 0)
const loadFailed = computed(() => Boolean(error.value) && !reactionData.value)
const loading = computed(() => !reactionData.value && (!viewerReady.value || isLoading.value || !props.autoload))
const disabled = computed(() => !reactionData.value || reactionSubmitLoading.value)

function handleReaction(state: INTER_KNOT.ReactionState) {
  if (!disabled.value)
    void setReactionState(state)
}
</script>

<template>
  <div class="px-2px rounded-full bg-[var(--vp-c-bg-alt)] flex h-9 items-center" role="group" :aria-label="message.forum.reaction.label">
    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full h-8 w-8"
      :aria-label="message.forum.reaction.like"
      :aria-pressed="reactionState === 'like'"
      :disabled="disabled"
      @click="handleReaction('like')"
    >
      <span
        class="i-lucide-arrow-up icon-btn"
        :class="{ 'text-[var(--vp-c-green-3)]': reactionState === 'like' }"
        aria-hidden="true"
      />
    </Button>

    <AnimatedNumber
      v-if="reactionData"
      :value="likeCount"
      class="px-1 tabular-nums"
      aria-live="polite"
    />
    <ReloadIcon v-else-if="loading" class="mx-1 animate-spin" aria-hidden="true" />
    <Button
      v-else-if="loadFailed"
      type="button"
      variant="link"
      class="px-1 h-8"
      @click="refetch()"
    >
      {{ message.forum.auth.callback.error.retry }}
    </Button>
    <span v-else class="px-1 tabular-nums" aria-hidden="true">–</span>

    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full h-8 w-8"
      :aria-label="message.forum.reaction.dislike"
      :aria-pressed="reactionState === 'dislike'"
      :disabled="disabled"
      @click="handleReaction('dislike')"
    >
      <span
        class="i-lucide-arrow-down icon-btn"
        :class="{ 'text-[var(--vp-c-red-3)]': reactionState === 'dislike' }"
        aria-hidden="true"
      />
    </Button>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
}
</style>
