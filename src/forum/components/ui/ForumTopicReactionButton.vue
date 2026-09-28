<script setup lang="ts">
import type { INTER_KNOT } from '~/apis/interknot.site/api'
import { ReloadIcon } from '@radix-icons/vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { TextMorph } from '@/components/ui/text-morph'
import { useLocalized } from '@/hooks/useLocalized'
import { useTopicsReaction } from '~/forum/composables/data/useTopicsReaction'

const props = withDefaults(defineProps<{
  topicId: string
  autoload?: boolean
  /** 组件挂载时强制重新拉取（无论缓存是否新鲜），用于详情页每次打开都计一次浏览量 */
  refetchOnMount?: 'always' | boolean
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
} = useTopicsReaction(() => props.topicId, () => props.autoload, { refetchOnMount: props.refetchOnMount })

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
  <div class="px-2px rounded-full bg-[var(--vp-c-bg-alt)] flex h-8 items-center max-mobile:h-9" role="group" :aria-label="message.forum.reaction.label">
    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full h-8 w-8 max-mobile:h-9 max-mobile:w-9"
      :aria-label="message.forum.reaction.like"
      :aria-pressed="reactionState === 'like'"
      :disabled="disabled"
      @click="handleReaction('like')"
    >
      <span
        class="i-lucide-arrow-up align-mid flex-shrink-0 h-5 w-5 inline-block max-mobile:h-5 max-mobile:w-5"
        :class="{ 'text-[var(--vp-c-green-3)]': reactionState === 'like' }"
        aria-hidden="true"
      />
    </Button>

    <TextMorph
      v-if="reactionData"
      :text="String(likeCount)"
      class="px-1 tabular-nums max-mobile:text-base"
      aria-live="polite"
    />
    <ReloadIcon v-else-if="loading" class="mx-1 animate-spin" aria-hidden="true" />
    <Button
      v-else-if="loadFailed"
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full h-8 w-8 max-mobile:h-9 max-mobile:w-9"
      :aria-label="message.forum.auth.callback.error.retry"
      @click="refetch()"
    >
      <span
        class="i-lucide-rotate-ccw align-mid flex-shrink-0 h-5 w-5 inline-block max-mobile:h-5 max-mobile:w-5"
        aria-hidden="true"
      />
    </Button>
    <span v-else class="px-1 tabular-nums" aria-hidden="true">–</span>

    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full h-8 w-8 max-mobile:h-9 max-mobile:w-9"
      :aria-label="message.forum.reaction.dislike"
      :aria-pressed="reactionState === 'dislike'"
      :disabled="disabled"
      @click="handleReaction('dislike')"
    >
      <span
        class="i-lucide-arrow-down align-mid flex-shrink-0 h-5 w-5 inline-block max-mobile:h-5 max-mobile:w-5"
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
