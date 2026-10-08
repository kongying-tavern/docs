<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ImageAttachment } from '~/forum/services/form/imageAttachment'
import { createReusableTemplate } from '@vueuse/core'
import { computed, nextTick, useTemplateRef } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import ForumImage from '~/forum/components/ui/ForumImage.vue'
import { formatImageAttachmentError } from '~/forum/components/utils/submitFormUi'
import { useForumImageDropZone } from '~/forum/composables/view/useForumImageDropZone'
import { IMAGE_UPLOAD_ACCEPT, IMAGE_UPLOAD_POLICY } from '~/forum/services/forumConfig'
import { formatMessage } from '~/utils/formatMessage'

const props = withDefaults(defineProps<{
  attachments: ImageAttachment[]
  disabled?: boolean
  hideDefaultTrigger?: boolean
  class?: HTMLAttributes['class']
  size?: 'xl' | 'lg' | 'sm'
  cardPreview?: boolean
  hideHint?: boolean
  previewMaxHeight?: number
}>(), {
  disabled: false,
  hideDefaultTrigger: false,
  size: 'xl',
})

const emit = defineEmits<{
  (e: 'files-selected', files: File[]): void
  (e: 'remove', id: string): void
  (e: 'retry', id: string): void
}>()

const atLimit = computed(() => props.attachments.length >= IMAGE_UPLOAD_POLICY.MAX_COUNT)
const selectionDisabled = computed(() => props.disabled || atLimit.value)
const input = useTemplateRef<HTMLInputElement>('input')
const dropZone = useTemplateRef<HTMLElement>('drop-zone')
const { message } = useLocalized()
const [DefineActions, Actions] = createReusableTemplate<{ attachment: ImageAttachment, index: number }>()
const previewImages = computed(() => props.attachments.map(attachment => ({
  src: attachment.previewUrl,
  alt: attachment.file?.name || attachment.savedImage?.alt || '',
  width: attachment.thumbHash?.originalWidth ?? attachment.savedImage?.width,
  height: attachment.thumbHash?.originalHeight ?? attachment.savedImage?.height,
  thumbHash: attachment.thumbHash?.dataBase64 ?? attachment.savedImage?.thumbHash,
})))
const previewSizeClass = computed(() => ({
  sm: 'size-20',
  lg: 'size-28',
  xl: 'size-32',
})[props.size])

function emitFiles(files: File[]): void {
  if (!selectionDisabled.value && files.length)
    emit('files-selected', files)
}

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emitFiles([...target.files || []])
  target.value = ''
}

function handlePaste(event: ClipboardEvent): void {
  if (event.clipboardData)
    emitFiles([...event.clipboardData.files])
}

async function removeAttachment(id: string, index: number): Promise<void> {
  emit('remove', id)
  await nextTick()

  const nextAttachment = props.attachments[Math.min(index, props.attachments.length - 1)]
  const nextButton = nextAttachment
    ? dropZone.value?.querySelector<HTMLButtonElement>(`[data-attachment-id="${CSS.escape(nextAttachment.id)}"] [data-remove-image]`)
    : undefined
  const focusTarget = nextButton ?? dropZone.value
  focusTarget?.focus({ preventScroll: true })
}

const { isOverDropZone } = useForumImageDropZone(dropZone, {
  disabled: computed(() => selectionDisabled.value || props.hideDefaultTrigger),
  onFiles: emitFiles,
})

function errorText(attachment: ImageAttachment): string {
  return attachment.error
    ? formatImageAttachmentError(attachment.error, message.value.forum.publish.feedbackForm)
    : message.value.forum.publish.feedbackForm.uploadFailed
}

function statusText(attachment: ImageAttachment): string {
  if (attachment.status === 'failed')
    return errorText(attachment)
  const copy = message.value.forum.publish.feedbackForm
  if (attachment.status === 'queued')
    return copy.imageQueued
  if (attachment.status === 'processing')
    return copy.imageProcessing
  return attachment.status === 'uploaded'
    ? copy.imageUploaded
    : copy.uploadingImages
        .replace('{settled}', '0')
        .replace('{total}', '1')
}

function open(): void {
  if (!selectionDisabled.value)
    input.value?.click()
}

defineExpose({ open })
</script>

<template>
  <DefineActions v-slot="{ attachment, index }">
    <div v-if="attachment.status === 'failed'" class="bg-[var(--forum-media-overlay-strong)] flex flex-col gap-1 items-center inset-0 justify-center absolute">
      <span class="i-lucide-circle-alert bg-[var(--forum-media-on-overlay)] size-4" aria-hidden="true" />
      <span class="text-[var(--forum-media-on-overlay)] leading-none font-medium text-ui-10">
        {{ message.forum.publish.feedbackForm.uploadFailedShort }}
      </span>
      <button
        type="button"
        class="mt-0.5 rounded-full bg-[var(--forum-media-overlay)] flex size-6 pointer-events-auto items-center justify-center"
        :aria-label="formatMessage(message.forum.publish.feedbackForm.retryImage, { filename: attachment.file?.name || attachment.savedImage?.alt || '' })"
        :disabled="disabled"
        @click="emit('retry', attachment.id)"
      >
        <span class="i-lucide-rotate-ccw bg-[var(--forum-media-on-overlay)] size-3.5" aria-hidden="true" />
      </button>
    </div>
    <button
      type="button"
      data-remove-image
      class="image-action rounded-bl-md bg-[var(--forum-media-overlay)] flex size-7 pointer-events-auto items-center right-0 top-0 justify-center absolute focus-visible:outline-[var(--forum-media-on-overlay)] focus-visible:outline-2 hover:bg-[var(--forum-media-overlay-strong)]"
      :aria-label="formatMessage(message.forum.publish.feedbackForm.removeImage, { filename: attachment.file?.name || attachment.savedImage?.alt || '' })"
      :disabled="disabled"
      @click="removeAttachment(attachment.id, index)"
    >
      <span
        class="bg-[var(--forum-media-on-overlay)] size-4"
        :class="attachment.status === 'uploading' ? 'i-lucide-loader-circle animate-spin' : 'i-lucide-x'"
        aria-hidden="true"
      />
    </button>
    <span class="sr-only" role="status">
      {{ statusText(attachment) }}
    </span>
  </DefineActions>
  <section
    ref="drop-zone"
    class="forum-image-upload mt-2"
    :class="props.class"
    tabindex="0"
    :aria-label="message.forum.publish.feedbackForm.attachmentsLabel"
    @paste="handlePaste"
  >
    <input
      ref="input"
      type="file"
      :aria-label="message.forum.publish.feedbackForm.addImages"
      :accept="IMAGE_UPLOAD_ACCEPT"
      :disabled="selectionDisabled"
      multiple hidden
      @change="handleInput"
    >
    <ForumImage
      v-if="cardPreview && attachments.length"
      :images="previewImages"
      layout="row"
      adaptive-row
      :rail-max-height="previewMaxHeight"
      :row-max-height="previewMaxHeight ?? 200"
      :max-display="IMAGE_UPLOAD_POLICY.MAX_COUNT"
      :preview-enabled="false"
      class="mt-3"
      aria-live="polite"
    >
      <template #image-overlay="{ index }">
        <div class="pointer-events-none inset-0 absolute" :data-status="attachments[index].status" :data-attachment-id="attachments[index].id">
          <Actions :attachment="attachments[index]" :index="index" />
        </div>
      </template>
    </ForumImage>
    <TransitionGroup
      v-if="!cardPreview"
      tag="ul"
      name="photo-grid"
      class="image-preview-list mt-3 flex flex-wrap gap-3 items-start"
      aria-live="polite"
    >
      <li
        v-for="(attachment, index) in attachments"
        :key="attachment.id"
        class="image-preview rounded-md relative overflow-hidden"
        :class="previewSizeClass"
        :data-status="attachment.status"
        :data-attachment-id="attachment.id"
      >
        <img
          :src="attachment.previewUrl"
          :alt="attachment.file?.name || attachment.savedImage?.alt || ''"
          class="size-full object-cover"
        >
        <Actions :attachment="attachment" :index="index" />
      </li>

      <li v-if="!hideDefaultTrigger" key="image-trigger">
        <button
          type="button"
          :disabled="selectionDisabled"
          class="image-trigger text-sm border-2 rounded-md border-dashed inline-flex flex-col gap-2 cursor-pointer transition-colors items-center justify-center"
          :class="[
            previewSizeClass,
            selectionDisabled ? 'cursor-not-allowed opacity-50' : '',
          ]"
          @click="open"
        >
          <span class="i-lucide:image-plus size-5" aria-hidden="true" />
          {{ message.forum.publish.feedbackForm.addImages }}
        </button>
      </li>
    </TransitionGroup>

    <p v-if="!hideHint && (attachments.length || !hideDefaultTrigger)" class="text-xs c-[var(--vp-c-text-3)] mt-2">
      {{ formatMessage(message.forum.publish.feedbackForm.attachmentsLimit, {
        count: attachments.length,
        max: IMAGE_UPLOAD_POLICY.MAX_COUNT,
        size: IMAGE_UPLOAD_POLICY.MAX_SIZE_LABEL,
      }) }}
    </p>

    <div v-if="isOverDropZone" class="image-drop-overlay" aria-hidden="true">
      <span class="i-lucide-images size-5" />
      <span>{{ message.forum.publish.feedbackForm.addImages }}</span>
    </div>
  </section>
</template>

<style scoped>
.forum-image-upload {
  position: relative;
  border-radius: 0.5rem;
}

.image-drop-overlay {
  position: absolute;
  z-index: 20;
  border: 2px dashed oklch(var(--ring));
  border-radius: inherit;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 86%, transparent);
  color: var(--vp-c-brand-1);
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  inset: -0.375rem;
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 600;
  pointer-events: none;
}

.image-trigger {
  border-color: color-mix(in srgb, var(--vp-c-text-1) 38%, transparent);
}

.image-trigger:hover:not(.cursor-not-allowed) {
  background: var(--vp-c-bg-soft);
  border-color: oklch(var(--ring));
}

.image-preview {
  background: var(--vp-c-bg-soft);
  box-shadow: inset 0 0 0 1px var(--forum-image-outline);
}

.photo-grid-move,
.photo-grid-enter-active {
  transition:
    transform 300ms linear(0, 0.22 8%, 0.6 18%, 0.94 30%, 1.07 40%, 1.05 48%, 1 60%, 0.99 74%, 1),
    opacity 210ms cubic-bezier(0.33, 1, 0.68, 1);
}

.photo-grid-leave-active {
  position: absolute;
  z-index: 1;
  transition:
    transform 200ms cubic-bezier(0.33, 1, 0.68, 1),
    opacity 200ms cubic-bezier(0.33, 1, 0.68, 1);
}

.photo-grid-enter-from,
.photo-grid-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

.image-preview[data-status='failed'] {
  box-shadow: inset 0 0 0 1px var(--vp-c-danger-1);
}

.image-action {
  transition:
    background-color 160ms ease,
    transform 140ms cubic-bezier(0.33, 1, 0.68, 1);
}

.image-action:active:not(:disabled) {
  transform: scale(0.88);
}

@media (pointer: coarse) {
  .image-preview {
    min-width: 7rem;
    min-height: 7rem;
  }

  .image-action,
  .image-preview-list button,
  [data-attachment-id] button {
    min-width: 44px;
    min-height: 44px;
  }
}

html[data-reduced-motion='true'] .photo-grid-move,
html[data-reduced-motion='true'] .photo-grid-enter-active,
html[data-reduced-motion='true'] .photo-grid-leave-active,
html[data-reduced-motion='true'] .image-action {
  transition: none;
}

html[data-reduced-motion='true'] .animate-spin {
  animation: none;
}
</style>
