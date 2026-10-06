<script setup lang="ts">
import { ReloadIcon } from '@radix-icons/vue'
import { computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TextMorph } from '@/components/ui/text-morph'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumReaction } from '~/forum/composables/data/useForumReaction'
import { useReactionStats } from '~/forum/composables/data/useReactionStats'

const { open, target } = useReactionStats()
const { message } = useLocalized()

const reactionTarget = computed(() => ({
  topicId: target.value?.topicId ?? '',
  commentId: target.value?.kind === 'comment' ? target.value.commentId : undefined,
}))
const reactionEnabled = computed(() => Boolean(target.value) && open.value)

const {
  data: reactionData,
  error,
  isLoading,
  refetch,
} = useForumReaction(reactionTarget, reactionEnabled)

const hasData = computed(() => Boolean(reactionData.value))
const loadFailed = computed(() => Boolean(error.value) && !hasData.value)
const loading = computed(() => !hasData.value && !loadFailed.value)
const likeCount = computed(() => reactionData.value?.data.likeCount ?? 0)
const dislikeCount = computed(() => reactionData.value?.data.dislikeCount ?? 0)
const viewCount = computed(() => reactionData.value?.data.clickCount ?? 0)
const reactionState = computed(() => reactionData.value?.state ?? null)

const statsTitle = computed(() => {
  const labels = message.value.forum.topic.menu.reactionStats
  if (!target.value)
    return ''
  const template = target.value.kind === 'comment' ? labels.commentTitle : labels.title
  const id = target.value.kind === 'comment' ? target.value.commentId : target.value.topicId
  return template.replace('{id}', id)
})

watch(() => open.value, (isOpen) => {
  if (isOpen && !isLoading.value)
    void refetch()
})
</script>

<template>
  <Dialog v-if="target" v-model:open="open">
    <DialogContent class="sm:max-w-[380px]">
      <DialogHeader>
        <DialogTitle>
          {{ statsTitle }}
        </DialogTitle>
      </DialogHeader>

      <div v-if="loadFailed" class="text-sm c-[var(--vp-c-danger-1)] py-2" role="alert">
        {{ message.forum.topic.menu.reactionStats.fail }}
      </div>

      <div v-else-if="loading" class="text-sm text-[var(--vp-c-text-3)] py-4 flex gap-2 items-center justify-center">
        <ReloadIcon class="animate-spin" aria-hidden="true" />
        {{ message.forum.topic.menu.reactionStats.loading }}
      </div>

      <div v-else class="py-2 flex items-center">
        <div class="flex flex-1 gap-1.5 items-center justify-center">
          <span class="i-lucide-arrow-up text-[var(--vp-c-green-3)]" aria-hidden="true" />
          <span class="sr-only">{{ message.forum.reaction.like }}</span>
          <TextMorph :text="String(likeCount)" class="text-lg leading-7 font-semibold tabular-nums" />
        </div>
        <div class="bg-[var(--vp-c-divider)] h-5 w-px" />
        <div class="flex flex-1 gap-1.5 items-center justify-center">
          <span class="i-lucide-arrow-down text-[var(--vp-c-red-3)]" aria-hidden="true" />
          <span class="sr-only">{{ message.forum.reaction.dislike }}</span>
          <TextMorph :text="String(dislikeCount)" class="text-lg leading-7 font-semibold tabular-nums" />
        </div>
        <div class="bg-[var(--vp-c-divider)] h-5 w-px" />
        <div class="flex flex-1 gap-1.5 items-center justify-center">
          <span class="i-lucide-eye" aria-hidden="true" />
          <span class="sr-only">{{ message.forum.topic.menu.reactionStats.views }}</span>
          <TextMorph :text="String(viewCount)" class="text-lg leading-7 font-semibold tabular-nums" />
        </div>
        <template v-if="reactionState">
          <div class="bg-[var(--vp-c-divider)] h-5 w-px" />
          <div class="flex flex-1 gap-1.5 items-center justify-center">
            <span class="i-lucide-user text-[var(--vp-c-text-2)]" aria-hidden="true" />
            <TextMorph :text="message.forum.reaction[reactionState]" class="text-lg leading-7 font-semibold" />
          </div>
        </template>
      </div>

      <DialogFooter class="sm:justify-end">
        <Button
          type="button"
          variant="outline"
          :disabled="isLoading"
          :aria-label="message.forum.topic.menu.reactionStats.refresh"
          @click="refetch()"
        >
          <ReloadIcon v-if="isLoading" class="mr-1 animate-spin" aria-hidden="true" />
          <span v-else class="i-lucide-rotate-ccw mr-1" aria-hidden="true" />
          {{ message.forum.topic.menu.reactionStats.refresh }}
        </Button>
        <DialogClose as-child>
          <Button type="button" variant="secondary">
            {{ message.ui.button.close }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
}
</style>
