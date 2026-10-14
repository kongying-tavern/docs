<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import ForumEditorToolIcon from '../form/ForumEditorToolIcon.vue'

defineProps<{ label: string, disabled: boolean, expanded: boolean, tools: boolean }>()
const emit = defineEmits<{ open: [], prepare: [], tool: [tool: 'emoji' | 'mention' | 'upload'] }>()
const { message } = useLocalized()
const element = useTemplateRef<HTMLElement>('element')
defineExpose({ element })
</script>

<template>
  <div ref="element" class="mobile-comment-entry" @pointerenter="emit('prepare')" @focusin="emit('prepare')" @pointerdown="emit('prepare')">
    <Button type="button" variant="ghost" class="mobile-comment-entry-text" :disabled="disabled" :aria-expanded="expanded" @click="emit('open')">
      {{ label }}
    </Button>
    <div v-if="tools" class="mobile-comment-entry-tools">
      <Button type="button" variant="ghost" size="icon" :disabled="disabled" :aria-label="message.ui.button.emoji" @click="emit('tool', 'emoji')">
        <ForumEditorToolIcon tool="emoji" />
      </Button>
      <Button type="button" variant="ghost" size="icon" :disabled="disabled" :aria-label="message.forum.publish.feedbackForm.mentionUser" @click="emit('tool', 'mention')">
        <ForumEditorToolIcon tool="mention" />
      </Button>
      <Button type="button" variant="ghost" size="icon" :disabled="disabled" :aria-label="message.forum.publish.feedbackForm.addImages" @click="emit('tool', 'upload')">
        <ForumEditorToolIcon tool="upload" />
      </Button>
    </div>
  </div>
</template>

<style scoped>
.mobile-comment-entry {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius);
  background: oklch(var(--background));
  font-family: var(--vp-font-family-base);
}
.mobile-comment-entry:has(.mobile-comment-entry-text:hover) {
  background: oklch(var(--accent));
}
.mobile-comment-entry .mobile-comment-entry-text {
  background: transparent;
}
.mobile-comment-entry :deep(button) {
  font-family: inherit;
}
.mobile-comment-entry-text {
  flex: 1;
  min-width: 0;
  min-height: 46px;
  justify-content: flex-start;
  padding-inline: 12px 4px;
  white-space: normal;
  text-align: left;
}
.mobile-comment-entry-tools {
  display: flex;
  flex-shrink: 0;
  padding-right: 4px;
}
.mobile-comment-entry-tools :deep(button) {
  width: 44px;
  height: 44px;
}
.mobile-comment-entry-tools :deep(.icon-btn) {
  width: 20px;
  height: 20px;
}
</style>
