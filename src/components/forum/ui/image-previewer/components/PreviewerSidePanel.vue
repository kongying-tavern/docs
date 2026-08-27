<script setup lang="ts">
import type { PreviewerContext } from '../ForumImagePreviewer.vue'
import { onBeforeUnmount, ref, watch } from 'vue'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import ForumTopicComment from '../../../comment/ForumTopicComment.vue'
import ForumTopicPreviewContent from '../../../topic/ForumTopicPreviewContent.vue'

const props = defineProps<{
  open: boolean
  context?: PreviewerContext
}>()

const emit = defineEmits<{ close: [] }>()

const EXIT_MS = 320
const rendered = ref(props.open)
let unmountTimer: number | undefined

watch(() => props.open, (open) => {
  clearTimeout(unmountTimer)
  if (open) {
    rendered.value = true
    return
  }
  unmountTimer = window.setTimeout(() => {
    rendered.value = false
  }, EXIT_MS)
}, { flush: 'sync' })

onBeforeUnmount(() => clearTimeout(unmountTimer))
</script>

<template>
  <Sheet
    v-if="context && rendered"
    :open="open"
    @update:open="!$event && emit('close')"
  >
    <SheetContent
      :force-mount="true"
      side="right"
      :show-close-button="false"
      style="animation-fill-mode: forwards"
      class="p-4 w-[min(560px,90vw)] z-[1001] overflow-y-auto sm:max-w-none"
      @interact-outside="(event) => event.preventDefault()"
      @close-auto-focus="(event) => event.preventDefault()"
    >
      <ForumTopicPreviewContent
        v-if="context.kind === 'topic' && context.topic"
        :topic="context.topic"
      />
      <ForumTopicComment
        v-else-if="context.kind === 'comment' && context.comment"
        :repo="context.repo"
        :topic-id="String(context.topic?.id ?? '')"
        :topic-author-id="context.topicAuthorId ?? -1"
        :comment-data="context.comment"
      />
    </SheetContent>
  </Sheet>
</template>
