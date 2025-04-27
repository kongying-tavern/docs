<script setup lang="ts">
import type { TopicReaction } from '~/composables/useTopicsReaction'
import { Button } from '@/components/ui/button'
import { ReloadIcon } from '@radix-icons/vue'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useTopicsReaction } from '~/composables/useTopicsReaction'

const { topicId } = defineProps<{
  topicId: string
}>()

const { getTopicReaction, setReactionState, reactionSubmitLoading } = useTopicsReaction()

const button = useTemplateRef('button')
const buttonIsVisible = ref(false)
const hasLoaded = ref(false)
const reactionData = ref<TopicReaction | null>(null)

const { stop } = useIntersectionObserver(
  button,
  async ([entry]) => {
    buttonIsVisible.value = entry?.isIntersecting || false
    if (entry?.isIntersecting && !hasLoaded.value) {
      stop()
      const result = await getTopicReaction(topicId)
      hasLoaded.value = true
      if (result.value) {
        reactionData.value = result.value
      }
    }
  },
)

const likeCount = computed(() => reactionData.value?.data?.likeCount)
const reactionState = computed(() => reactionData.value?.state)
</script>

<template>
  <Button ref="button" variant="ghost" class="rounded-full bg-[var(--vp-c-bg-alt)] px-8px">
    <button class="i-lucide-arrow-up icon-btn rounded-full transition hover:bg-green" :class="{ 'bg-green': reactionState === 'like' }" :disabled="reactionSubmitLoading" @click="setReactionState('like', topicId)" />
    <span v-if="hasLoaded"> {{ likeCount || '0' }} </span>
    <ReloadIcon v-else class="animate-spin" />
    <button class="i-lucide-arrow-down icon-btn rounded-full transition hover:bg-red" :class="{ 'bg-red': reactionState === 'dislike' }" :disabled="reactionSubmitLoading" @click="setReactionState('dislike', topicId)" />
  </Button>
</template>
