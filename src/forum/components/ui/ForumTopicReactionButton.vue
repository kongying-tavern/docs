<script setup lang="ts">
import type { INTER_KNOT } from '~/forum/api/interknot.site/api'
import { ReloadIcon } from '@radix-icons/vue'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { TextMorph } from '@/components/ui/text-morph'
import { useLocalized } from '@/hooks/useLocalized'
import { useTopicsReaction } from '~/forum/composables/data/useTopicsReaction'

const { autoload = true, topicId, refetchOnMount } = defineProps<{
  topicId: string
  autoload?: boolean
  /** 组件挂载时强制重新拉取（无论缓存是否新鲜），用于详情页每次打开都计一次浏览量 */
  refetchOnMount?: 'always' | boolean
}>()
const { message } = useLocalized()
const {
  data: reactionData,
  error,
  refetch,
  setReactionState,
  reactionSubmitLoading,
} = useTopicsReaction(() => topicId, () => autoload, { refetchOnMount })

const reactionState = computed(() => reactionData.value?.state ?? null)
const likeCount = computed(() => reactionData.value?.data.likeCount ?? 0)
const loadFailed = computed(() => Boolean(error.value) && !reactionData.value)
const retrying = ref(false)
const disabled = computed(() => !reactionData.value || reactionSubmitLoading.value)

async function retryReaction() {
  retrying.value = true
  try {
    await refetch()
  }
  finally {
    retrying.value = false
  }
}

function handleReaction(state: INTER_KNOT.ReactionState) {
  if (!disabled.value)
    void setReactionState(state)
}
</script>

<template>
  <div class="px-2px rounded-full bg-[var(--vp-c-bg-alt)] flex h-8 items-center max-mobile:h-9" role="group" :aria-label="message.forum.reaction.label" data-forum-reaction="topic">
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
      v-if="!loadFailed && !retrying"
      :disabled="!autoload"
      :text="String(likeCount)"
      class="px-1 tabular-nums max-mobile:text-base"
      aria-live="polite"
    />
    <Button
      v-else
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full h-8 w-8 max-mobile:h-9 max-mobile:w-9"
      :aria-label="message.forum.auth.callback.error.retry"
      :disabled="retrying"
      :aria-busy="retrying"
      @click="retryReaction"
    >
      <ReloadIcon :class="{ 'animate-spin motion-reduce:animate-none': retrying }" aria-hidden="true" />
    </Button>

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
html[data-reduced-motion='true'] .animate-spin {
  animation: none;
}
</style>
