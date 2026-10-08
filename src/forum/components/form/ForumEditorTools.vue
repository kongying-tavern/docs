<script setup lang="ts">
import type { EmojiItem } from '@/components/ui/EmojiPicker.vue'
import type ForumAPI from '~/forum/api/types'
import { LoaderCircleIcon } from '@lucide/vue'
import { onClickOutside, useEventListener } from '@vueuse/core'
import { ref, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import EmojiPicker from '@/components/ui/EmojiPicker.vue'
import EmojiPickerPanel from '@/components/ui/EmojiPickerPanel.vue'
import MentionPicker from '@/components/ui/MentionPicker.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { IMAGE_UPLOAD_POLICY } from '~/forum/services/forumConfig'
import ForumEditorToolIcon from './ForumEditorToolIcon.vue'

const { imageCount = 0, disabled } = defineProps<{
  features: string[]
  mobile?: boolean
  mentionActive?: boolean
  disabled?: boolean
  submitting?: boolean
  submitDisabled?: boolean
  uploadDisabled?: boolean
  imageCount?: number
  status?: string
  mentionUsers: ForumAPI.User[]
}>()
const emit = defineEmits<{
  'emoji': [emoji: EmojiItem]
  'mention': [user: ForumAPI.User]
  'upload': []
  'submit': []
  'tool-open': [tool: 'emoji' | 'mention']
  'tool-close': [restoreFocus?: boolean]
}>()
const { message } = useLocalized()
const activeTool = ref<'emoji' | null>(null)
const emojiPanel = useTemplateRef<HTMLElement>('emojiPanel')
onClickOutside(emojiPanel, () => activeTool.value && close(false))
useEventListener('focusin', (event) => {
  if (activeTool.value && event.target instanceof Node && !emojiPanel.value?.contains(event.target))
    close(false)
})
const emojiOpen = ref(false)
const mentionOpen = ref(false)
function toggle(tool: 'emoji' | 'mention'): void {
  if (tool === 'mention') {
    activeTool.value = null
    emit('tool-open', tool)
    return
  }
  if (activeTool.value === tool) {
    close()
    return
  }
  emit('tool-open', tool)
  activeTool.value = tool
}
function close(restoreFocus = true): void {
  activeTool.value = null
  emit('tool-close', restoreFocus)
}
watch(() => disabled, disabled => disabled && (activeTool.value = null))
watch(emojiOpen, open => open && emit('tool-open', 'emoji'))
watch(mentionOpen, open => open && emit('tool-open', 'mention'))
defineExpose({ close, open: toggle })
</script>

<template>
  <div class="editor-tools" :class="{ 'editor-tools-mobile': mobile }">
    <div class="editor-tools-row">
      <div class="editor-tool-actions flex gap-1 items-center">
        <template v-if="mobile">
          <Button v-if="features.includes('Emoji') && !activeTool" type="button" variant="ghost" size="icon" :disabled="disabled" :aria-label="message.ui.button.emoji" :aria-expanded="activeTool === 'emoji'" @pointerdown.prevent @click="toggle('emoji')">
            <ForumEditorToolIcon tool="emoji" />
          </Button>
          <Button v-if="features.includes('Mention')" type="button" variant="ghost" size="icon" :disabled="disabled" :aria-label="message.forum.publish.feedbackForm.mentionUser" :aria-expanded="mentionActive" @pointerdown.prevent @click="toggle('mention')">
            <ForumEditorToolIcon tool="mention" />
          </Button>
        </template>
        <template v-else>
          <EmojiPicker v-if="features.includes('Emoji')" v-model:open="emojiOpen" :disabled="disabled" @close-auto-focus="$event.preventDefault(); emit('tool-close')" @select="emit('emoji', $event)" />
          <MentionPicker v-if="features.includes('Mention')" v-model:open="mentionOpen" :items="mentionUsers" :disabled="disabled" @close-auto-focus="$event.preventDefault(); emit('tool-close')" @select="emit('mention', $event)" />
        </template>
        <Button v-if="features.includes('Upload')" type="button" variant="ghost" :size="mobile ? imageCount ? 'sm' : 'icon' : 'icon-sm'" :class="{ 'editor-upload-capsule': mobile && imageCount > 0 }" :disabled="disabled || uploadDisabled" :aria-label="message.forum.publish.feedbackForm.addImages" @pointerdown.prevent @click="emit('upload')">
          <ForumEditorToolIcon tool="upload" />
          <span v-if="mobile && imageCount" class="text-xs text-muted-foreground tabular-nums">{{ imageCount }}/{{ IMAGE_UPLOAD_POLICY.MAX_COUNT }}</span>
        </Button>
      </div>
      <Button v-if="features.includes('Submit')" type="button" :variant="mobile && (disabled || submitDisabled) ? 'outline' : 'default'" :size="mobile ? 'sm' : 'default'" :disabled="disabled || submitDisabled" class="editor-publish" :class="{ 'rounded-full': mobile, 'bg-transparent dark:bg-transparent shadow-none': mobile && (disabled || submitDisabled) }" @click="emit('submit')">
        <LoaderCircleIcon v-if="submitting" class="animate-spin" data-icon="inline-start" />
        {{ message.forum.comment.publish }}
      </Button>
    </div>
    <Transition name="editor-emoji">
      <section v-if="mobile && activeTool === 'emoji'" ref="emojiPanel" class="editor-tool-panel bg-muted/50" :aria-label="message.ui.button.emoji">
        <EmojiPickerPanel :open="true" compact :close-on-select="false" :record-count="7" :disabled="disabled" @select="emit('emoji', $event)" />
      </section>
    </Transition>
    <p v-if="status" class="text-xs text-muted-foreground m-0" :class="{ 'sr-only': mobile }" role="status">
      {{ status }}
    </p>
  </div>
</template>

<style scoped>
.editor-tools {
  flex-shrink: 0;
}
.editor-tools-mobile :deep(button) {
  font-family: inherit;
}
.editor-tools-mobile :deep(.editor-publish) {
  position: relative;
  height: 36px;
  min-height: 36px;
  min-width: 56px;
  padding: 0 12px;
  border: 1px solid oklch(var(--primary-button));
  @apply text-ui-14;
  line-height: 20px;
  font-weight: 500;
}
/* Keep the touch area aligned with the 44px icon controls. */
.editor-tools-mobile :deep(.editor-publish::before) {
  content: '';
  position: absolute;
  inset: -4px 0;
}
.editor-tools-mobile :deep(.editor-publish:disabled) {
  opacity: 1;
  color: oklch(var(--primary-button));
}
.editor-tools-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
/* Align the 24px glyph with the body inside its 36px button. */
.editor-tools-mobile .editor-tool-actions {
  margin-inline-start: -6px;
  gap: 0;
}
.editor-tool-panel {
  overflow: hidden;
}
.editor-upload-capsule {
  min-height: 36px;
  border-radius: 9999px;
}
.editor-tools-mobile :deep(.editor-tools-row button[data-size='icon']) {
  min-height: 36px;
}
.editor-tools-mobile :deep(.editor-tools-row .icon-btn) {
  width: 24px;
  height: 24px;
}
.editor-tools-mobile :deep(.editor-tool-actions button) {
  position: relative;
  height: 36px;
}
.editor-tools-mobile :deep(.editor-tool-actions button::before) {
  content: '';
  position: absolute;
  inset: -4px 0;
}
.editor-tools-mobile .editor-tool-panel {
  height: min(352px, max(100px, calc(var(--compact-viewport-height, 100dvh) - 160px)));
  margin: 4px -16px -12px;
  padding: 8px 16px 12px;
  border-top: 1px solid var(--vp-c-divider);
}
.editor-tools-mobile :deep(.editor-tools-row button[data-size='icon']) {
  width: 36px;
  min-width: 36px;
}
.editor-emoji-enter-active,
.editor-emoji-leave-active {
  transition:
    height 180ms ease,
    opacity 180ms ease,
    padding 180ms ease,
    margin 180ms ease;
}
.editor-tools-mobile .editor-emoji-enter-from,
.editor-tools-mobile .editor-emoji-leave-to {
  height: 0;
  opacity: 0;
  padding-block: 0;
  margin-block: 0;
}
html[data-reduced-motion='true'] .editor-emoji-enter-active,
html[data-reduced-motion='true'] .editor-emoji-leave-active {
  transition: none;
}
</style>
