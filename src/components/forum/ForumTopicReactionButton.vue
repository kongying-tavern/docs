<script setup lang="ts">
import type { INTER_KNOT } from '@/apis/interknot.site/api'
import type { TopicReaction } from '~/composables/useTopicsReaction'
import { ReloadIcon } from '@radix-icons/vue'
import { computed, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useTopicsReaction } from '~/composables/useTopicsReaction'

const { topicId } = defineProps<{ topicId: string }>()
const { message } = useLocalized()
const { getTopicReaction, setReactionState, reactionSubmitLoading } = useTopicsReaction()
const reactionData = ref<TopicReaction | null>(null)
const loading = ref(true)
const loadFailed = ref(false)

const likeCount = computed(() => reactionData.value?.data.likeCount ?? 0)
const reactionState = computed(() => reactionData.value?.state)

async function load(force = false) {
  loading.value = true
  loadFailed.value = false
  try {
    reactionData.value = await getTopicReaction(topicId, force)
    loadFailed.value = !reactionData.value
  }
  catch {
    loadFailed.value = true
  }
  finally {
    loading.value = false
  }
}

async function handleReaction(state: INTER_KNOT.ReactionState) {
  const result = await setReactionState(state, topicId)
  if (result)
    reactionData.value = result
}

onMounted(() => load())
</script>

<template>
  <div class="px-8px rounded-full bg-[var(--vp-c-bg-alt)] flex h-9 items-center" role="group" :aria-label="message.forum.reaction.label">
    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full h-8 w-8"
      :class="{ 'bg-green': reactionState === 'like' }"
      :aria-label="message.forum.reaction.like"
      :aria-pressed="reactionState === 'like'"
      :disabled="loading || loadFailed || reactionSubmitLoading"
      @click="handleReaction('like')"
    >
      <span class="i-lucide-arrow-up icon-btn" aria-hidden="true" />
    </Button>

    <span v-if="!loading && !loadFailed" class="px-1 tabular-nums" aria-live="polite">
      {{ likeCount }}
    </span>
    <ReloadIcon v-else-if="loading" class="mx-1 animate-spin" aria-hidden="true" />
    <Button v-else type="button" variant="link" class="px-1 h-8" @click="load(true)">
      {{ message.forum.auth.callback.error.retry }}
    </Button>

    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full h-8 w-8"
      :class="{ 'bg-red': reactionState === 'dislike' }"
      :aria-label="message.forum.reaction.dislike"
      :aria-pressed="reactionState === 'dislike'"
      :disabled="loading || loadFailed || reactionSubmitLoading"
      @click="handleReaction('dislike')"
    >
      <span class="i-lucide-arrow-down icon-btn" aria-hidden="true" />
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
