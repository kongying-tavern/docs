<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { Maximize2Icon, Minimize2Icon } from '@lucide/vue'
import { createReusableTemplate, useEventListener, useMutationObserver } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { useMobileEditorViewport } from '~/forum/composables/view/useMobileEditorViewport'
import { useCommentEditorMorph } from './composables/useCommentEditorMorph'

const props = defineProps<{ embedded: boolean, pending: boolean, origin?: HTMLElement, replyUser?: ForumAPI.User, error?: string }>()
const emit = defineEmits<{ 'cancel-reply': [], 'focus-editor': [] }>()
const open = defineModel<boolean>('open', { required: true })
const { message } = useLocalized()
const { reducedMotion } = useSitePreferences()
const expanded = ref(false)
const motionReady = ref(false)
const root = useTemplateRef<HTMLElement>('root')
const editorHost = useTemplateRef<HTMLElement>('editorHost')
const desktop = computed(() => props.embedded)
const { drawerStyle } = useMobileEditorViewport(open, desktop, root, '.rich-editor-scroll')
const morph = useCommentEditorMorph(root, () => props.origin)
const [Panel, PanelContent] = createReusableTemplate()
watch(open, (value) => {
  if (value)
    motionReady.value = false
  else
    morph.prepare()
}, { flush: 'sync' })

async function showEditor(event: Event): Promise<void> {
  event.preventDefault()
  await nextTick()
  motionReady.value = morph.prepare()
  if (reducedMotion.value || !motionReady.value)
    emit('focus-editor')
}

function afterAnimation(event: AnimationEvent): void {
  if (event.target === event.currentTarget && event.animationName.startsWith('comment-editor-enter') && open.value)
    emit('focus-editor')
}

let pointerDismiss = false
let focusPending = false
function guardDismiss(event: Event): void {
  if (props.pending) {
    event.preventDefault()
    return
  }
  pointerDismiss = event instanceof CustomEvent && event.detail?.originalEvent?.type === 'pointerdown'
}

function focusOrigin(): void {
  requestAnimationFrame(async () => {
    await nextTick()
    if (open.value || pointerDismiss)
      return
    const origin = props.origin
    const target = origin?.matches('button') ? origin : origin?.querySelector<HTMLElement>('button:not(:disabled)')
    if (target && getComputedStyle(target).visibility !== 'hidden') {
      focusPending = false
      target.focus({ preventScroll: true })
    }
  })
}

useEventListener(() => typeof window === 'undefined' ? undefined : window, ['pointerup', 'pointercancel'], () => {
  pointerDismiss = false
  if (focusPending) {
    focusOrigin()
  }
})

// The fixed entry becomes visible after the modal presence has finished closing.
useMutationObserver(() => props.origin?.parentElement, () => {
  if (focusPending)
    focusOrigin()
}, { attributes: true, attributeFilter: ['class', 'style'] })

function restoreFocus(event: Event): void {
  event.preventDefault()
  // An immediate close can precede pointerup; restore after the click finishes.
  focusPending = true
  if (!pointerDismiss)
    focusOrigin()
}
function setOpen(value: boolean): void {
  if (!props.pending)
    open.value = value
}
</script>

<template>
  <Panel>
    <div ref="root" class="mobile-comment-panel" :class="{ 'comment-expanded': expanded }">
      <header class="mobile-comment-header">
        <Button type="button" variant="ghost" size="icon-sm" :aria-label="expanded ? message.forum.publish.feedbackForm.collapse : message.forum.publish.feedbackForm.expand" :aria-pressed="expanded" @click="expanded = !expanded">
          <Minimize2Icon v-if="expanded" /><Maximize2Icon v-else />
        </Button>
      </header>
      <div v-if="replyUser" class="mobile-comment-reply">
        <span>{{ message.forum.comment.reply }} @{{ replyUser.login }}</span>
        <Button type="button" variant="ghost" size="sm" :disabled="pending" @click="emit('cancel-reply')">
          {{ message.ui.button.cancel }}
        </Button>
      </div>
      <Alert v-if="error" variant="destructive" class="mx-4 mb-2 w-auto" role="alert">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <div ref="editorHost" class="mobile-comment-editor" />
    </div>
  </Panel>
  <div v-if="embedded" v-show="open" class="mobile-comment-embedded">
    <PanelContent />
  </div>
  <Dialog v-else :open="open" @update:open="setOpen">
    <DialogContent class="mobile-comment-dialog" :class="{ 'comment-expanded': expanded, 'motion-ready': motionReady, 'motion-reduced': reducedMotion }" :style="[drawerStyle, morph.style.value]" :show-close-button="false" :aria-describedby="undefined" @open-auto-focus="showEditor" @close-auto-focus="restoreFocus" @escape-key-down="guardDismiss" @pointer-down-outside="guardDismiss" @animationend="afterAnimation">
      <DialogTitle class="sr-only">
        {{ message.forum.comment.comment }}
      </DialogTitle>
      <PanelContent />
    </DialogContent>
  </Dialog>
  <!-- The caller owns the editor and its draft, and teleports into this host. -->
  <slot :target="editorHost" :active="open" />
</template>

<style scoped>
.mobile-comment-panel {
  font-family: var(--vp-font-family-base);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.mobile-comment-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
}
.mobile-comment-header :deep(button) {
  font-family: inherit;
  min-width: 32px;
  min-height: 32px;
}
.mobile-comment-header :deep(svg) {
  width: 16px;
  height: 16px;
}
.mobile-comment-reply {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-inline: 16px;
  color: oklch(var(--muted-foreground));
  font-size: 12px;
}
.mobile-comment-reply > span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.mobile-comment-reply :deep(button) {
  font-family: inherit;
  min-height: 44px;
}
.mobile-comment-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0 16px 12px;
}
.mobile-comment-embedded {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius);
  min-height: min(320px, 55dvh);
  max-height: 80dvh;
  margin-top: 12px;
  transition: height 180ms ease;
}
.mobile-comment-embedded:has(.comment-expanded) {
  height: min(640px, 80dvh);
}
.mobile-comment-embedded:has(.editor-tool-panel) {
  min-height: min(552px, 80dvh);
}
:global(.mobile-comment-dialog[data-slot='dialog-content']) {
  top: auto;
  left: 0;
  bottom: var(--compact-viewport-bottom, 0px);
  width: 100%;
  max-width: none;
  height: auto;
  min-height: min(320px, calc(var(--compact-viewport-height, 100dvh) - 12px));
  max-height: calc(var(--compact-viewport-height, 100dvh) - 12px) !important;
  display: flex;
  flex-direction: column;
  padding: 8px 0 0;
  overflow: clip;
  border-radius: 16px 16px 0 0;
  transform: none;
  /* Keep this reset separate from transform when Lightning CSS folds transforms. */
  translate: none !important;
  animation: none;
  transition: height 180ms ease;
}
:global(.mobile-comment-dialog.comment-expanded[data-slot='dialog-content']) {
  height: calc(var(--compact-viewport-height, 100dvh) - 12px);
}
:global(.mobile-comment-dialog:not(.comment-expanded)[data-slot='dialog-content']:has(.editor-tool-panel)) {
  min-height: min(552px, calc(var(--compact-viewport-height, 100dvh) - 12px));
}
:global(.mobile-comment-dialog.motion-ready:not(.motion-reduced)[data-state='open']) {
  animation: comment-editor-enter 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
:global(.mobile-comment-dialog.motion-ready:not(.motion-reduced)[data-state='closed']) {
  animation: comment-editor-exit 240ms cubic-bezier(0.22, 1, 0.36, 1);
}
:global(.mobile-comment-dialog.motion-ready:not(.motion-reduced)[data-state='open'] .mobile-comment-panel) {
  animation: comment-editor-content-enter 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
:global(.mobile-comment-dialog.motion-ready:not(.motion-reduced)[data-state='closed'] .mobile-comment-panel) {
  animation: comment-editor-content-exit 100ms ease both;
}
@keyframes comment-editor-content-enter {
  0%,
  30% {
    opacity: 0;
    transform: translateY(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes comment-editor-content-exit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes comment-editor-enter {
  from {
    min-height: 0;
    left: var(--comment-entry-left);
    top: var(--comment-entry-top);
    bottom: auto;
    width: var(--comment-entry-width);
    height: var(--comment-entry-height);
    border-radius: var(--comment-entry-radius);
  }
  to {
    min-height: 0;
    left: 0;
    top: var(--comment-panel-top);
    bottom: auto;
    width: 100%;
    height: var(--comment-panel-height);
    border-radius: 16px 16px 0 0;
  }
}
@keyframes comment-editor-exit {
  from {
    min-height: 0;
    left: var(--comment-panel-left);
    top: var(--comment-panel-top);
    bottom: auto;
    width: var(--comment-panel-width);
    height: var(--comment-panel-height);
    border-radius: var(--comment-panel-radius);
  }
  to {
    min-height: 0;
    left: var(--comment-entry-left);
    top: var(--comment-entry-top);
    bottom: auto;
    width: var(--comment-entry-width);
    height: var(--comment-entry-height);
    border-radius: var(--comment-entry-radius);
  }
}
html[data-reduced-motion='true'] .mobile-comment-embedded,
html[data-reduced-motion='true'] :global(.mobile-comment-dialog .mobile-comment-panel),
html[data-reduced-motion='true'] :global(.mobile-comment-dialog[data-slot='dialog-content']) {
  transition: none;
  animation: none !important;
}
</style>
