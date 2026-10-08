<script setup lang="ts">
import type { PreviewerContext } from '../ForumImagePreviewer.vue'
import { defineAsyncComponent } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import ForumCommentItem from '../../../comment/ForumCommentItem.vue'

defineProps<{
  open: boolean
  context?: PreviewerContext
}>()

const emit = defineEmits<{
  beforeEnter: []
  afterEnter: []
  enterCancelled: []
}>()

const ForumTopicPreviewContent = defineAsyncComponent(() => import('../../../topic/ForumTopicPreviewContent.vue'))

const { message } = useLocalized()
</script>

<template>
  <Transition
    name="preview-side-panel"
    appear
    @before-enter="emit('beforeEnter')"
    @after-enter="emit('afterEnter')"
    @enter-cancelled="emit('enterCancelled')"
  >
    <aside
      v-if="open && context"
      :aria-label="message.forum.topic.previewTitle"
      class="preview-side-panel p-4 bg-background flex flex-col gap-4 w-[min(560px,90vw)] inset-y-0 right-0 absolute overflow-y-auto"
      @pointerdown.stop
      @pointermove.stop
      @pointerup.stop
      @pointercancel.stop
      @wheel.stop
      @click.stop
    >
      <Suspense v-if="context.kind === 'topic' && context.topic">
        <ForumTopicPreviewContent :topic="context.topic" />
        <template #fallback>
          <p role="status" aria-live="polite">
            {{ message.forum.comment.loadingComment }}
          </p>
        </template>
      </Suspense>
      <ForumCommentItem
        v-else-if="context.kind === 'comment' && context.comment"
        :repo="context.repo"
        :topic-id="String(context.topic?.id ?? '')"
        :topic-author-id="context.topicAuthorId ?? -1"
        :comment-data="context.comment"
      />
    </aside>
  </Transition>
</template>

<style scoped>
.preview-side-panel {
  user-select: text;
  touch-action: pan-y;
  overscroll-behavior: contain;
}

.preview-side-panel-enter-active {
  transition: transform 500ms ease-in-out;
}

.preview-side-panel-leave-active {
  transition: transform 300ms ease-in-out;
  pointer-events: none;
}

.preview-side-panel-enter-from,
.preview-side-panel-leave-to {
  transform: translateX(100%);
}

html[data-reduced-motion='true'] .preview-side-panel-enter-active,
html[data-reduced-motion='true'] .preview-side-panel-leave-active {
  transition: none;
}
</style>
