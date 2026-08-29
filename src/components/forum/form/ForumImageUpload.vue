<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ImageAttachment } from '~/services/forum/form/imageAttachment'
import { computed, useId, useTemplateRef } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { formatImageAttachmentError, formatMessage } from '~/components/forum/utils/forumUi'
import { useForumImageDropZone } from '~/composables/forum/useForumImageDropZone'
import { IMAGE_UPLOAD_ACCEPT, IMAGE_UPLOAD_POLICY } from '~/services/forum/forumConfig'

const props = withDefaults(defineProps<{
  attachments: ImageAttachment[]
  disabled?: boolean
  hideDefaultTrigger?: boolean
  class?: HTMLAttributes['class']
  size?: 'xl' | 'lg' | 'sm'
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
const inputId = `forum-image-picker-${useId()}`
const input = useTemplateRef<HTMLInputElement>('input')
const dropZone = useTemplateRef<HTMLElement>('drop-zone')
const { message } = useLocalized()
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
  return attachment.status === 'uploaded'
    ? message.value.forum.publish.feedbackForm.success
    : message.value.forum.publish.feedbackForm.uploadingImages
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
  <section
    ref="drop-zone"
    class="forum-image-upload mt-2"
    :class="props.class"
    tabindex="0"
    :aria-label="message.forum.publish.feedbackForm.attachmentsLabel"
    @paste="handlePaste"
  >
    <input
      :id="inputId"
      ref="input"
      class="sr-only"
      type="file"
      :accept="IMAGE_UPLOAD_ACCEPT"
      :disabled="selectionDisabled"
      multiple
      @change="handleInput"
    >
    <ul class="mt-3 flex flex-wrap gap-3 items-start" aria-live="polite">
      <li
        v-for="attachment in attachments"
        :key="attachment.id"
        class="image-preview rounded-md relative overflow-hidden"
        :class="previewSizeClass"
        :data-status="attachment.status"
      >
        <img
          :src="attachment.previewUrl"
          :alt="attachment.file.name"
          class="size-full object-cover"
        >
        <div v-if="attachment.status === 'failed'" class="bg-[var(--forum-media-overlay-soft)] flex items-center inset-0 justify-center absolute">
          <button
            type="button"
            class="rounded-full bg-[var(--forum-media-overlay)] flex size-8 items-center justify-center"
            :aria-label="formatMessage(message.forum.publish.feedbackForm.retryImage, { filename: attachment.file.name })"
            :disabled="disabled"
            @click="emit('retry', attachment.id)"
          >
            <span class="i-lucide-rotate-ccw bg-[var(--forum-media-on-overlay)] size-4" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          class="image-action rounded-bl-md bg-[var(--forum-media-overlay)] flex size-7 items-center right-0 top-0 justify-center absolute focus-visible:outline-2 focus-visible:outline-[var(--forum-media-on-overlay)] hover:bg-[var(--forum-media-overlay-strong)]"
          :aria-label="formatMessage(message.forum.publish.feedbackForm.removeImage, { filename: attachment.file.name })"
          :disabled="disabled"
          @click="emit('remove', attachment.id)"
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
      </li>

      <li v-if="!hideDefaultTrigger">
        <label
          :for="inputId"
          class="image-trigger text-sm border-2 rounded-md border-dashed inline-flex flex-col gap-2 cursor-pointer transition-colors items-center justify-center"
          :class="[
            previewSizeClass,
            selectionDisabled ? 'cursor-not-allowed opacity-50' : '',
          ]"
        >
          <span class="i-lucide:image-plus size-5" aria-hidden="true" />
          {{ message.forum.publish.feedbackForm.addImages }}
        </label>
      </li>
    </ul>

    <p class="text-xs c-[var(--vp-c-text-3)] mt-2">
      {{ formatMessage(message.forum.publish.feedbackForm.attachmentsLimit, {
        count: attachments.length,
        max: IMAGE_UPLOAD_POLICY.MAX_COUNT,
        size: IMAGE_UPLOAD_POLICY.MAX_SIZE_LABEL,
      }) }}
    </p>

    <p v-if="attachments.length" class="text-xs c-[var(--vp-c-text-3)] mt-2">
      {{ message.forum.publish.feedbackForm.localFilesWarning }}
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
  border: 2px dashed var(--vp-c-brand-1);
  border-radius: inherit;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 86%, transparent);
  color: var(--vp-c-brand-1);
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  inset: -0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  pointer-events: none;
}

.image-trigger {
  border-color: color-mix(in srgb, var(--vp-c-text-1) 38%, transparent);
}

.image-trigger:hover:not(.cursor-not-allowed) {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand-1);
}

.image-preview {
  background: var(--vp-c-bg-soft);
  box-shadow: inset 0 0 0 1px var(--vp-c-divider);
}

.image-preview[data-status='failed'] {
  box-shadow: inset 0 0 0 1px var(--vp-c-danger-1);
}

.image-action {
  transition: background-color 160ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
}
</style>
