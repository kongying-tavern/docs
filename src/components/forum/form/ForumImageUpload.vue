<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ImageAttachment } from '~/composables/useImageAttachmentQueue'
import { computed, useId, useTemplateRef } from 'vue'
import { Button } from '@/components/ui/button'
import { IMAGE_UPLOAD_ACCEPT, IMAGE_UPLOAD_POLICY } from '../constants'

const props = withDefaults(defineProps<{
  attachments: ImageAttachment[]
  disabled?: boolean
  hideDefaultTrigger?: boolean
  class?: HTMLAttributes['class']
  size?: 'xl' | 'lg'
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

function handleDrop(event: DragEvent): void {
  emitFiles([...event.dataTransfer?.files || []])
}

function statusText(attachment: ImageAttachment): string {
  return attachment.error?.message || attachment.status
}

function open(): void {
  if (!selectionDisabled.value)
    input.value?.click()
}

defineExpose({ open })
</script>

<template>
  <section
    class="mt-2 p-3 border rounded-md border-dashed"
    :class="props.class"
    tabindex="0"
    aria-label="Image attachments"
    @drop.prevent="handleDrop"
    @dragover.prevent
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
    <label
      v-if="!hideDefaultTrigger"
      :for="inputId"
      class="px-3 py-2 border rounded-md inline-flex gap-2 cursor-pointer items-center"
      :class="selectionDisabled ? 'cursor-not-allowed opacity-50' : ''"
    >
      <span class="i-lucide:image-plus" aria-hidden="true" />
      Add images
    </label>
    <p class="text-xs c-[var(--vp-c-text-3)] mt-2">
      {{ attachments.length }} / {{ IMAGE_UPLOAD_POLICY.MAX_COUNT }} · {{ IMAGE_UPLOAD_POLICY.MAX_SIZE_LABEL }} each
    </p>

    <ul v-if="attachments.length" class="mt-3 flex flex-wrap gap-3" aria-live="polite">
      <li
        v-for="attachment in attachments"
        :key="attachment.id"
        class="p-2 border rounded-md flex flex-col gap-2"
      >
        <img
          :src="attachment.previewUrl"
          :alt="attachment.file.name"
          class="rounded object-cover"
          :class="size === 'lg' ? 'size-24' : 'size-18'"
        >
        <span class="text-xs max-w-24 truncate">{{ attachment.file.name }}</span>
        <span class="text-xs" role="status">{{ statusText(attachment) }}</span>
        <div class="flex gap-2">
          <Button
            v-if="attachment.status === 'failed'"
            type="button"
            size="sm"
            variant="outline"
            :aria-label="`Retry ${attachment.file.name}`"
            :disabled="disabled"
            @click="emit('retry', attachment.id)"
          >
            Retry
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            :aria-label="`Remove ${attachment.file.name}`"
            :disabled="disabled"
            @click="emit('remove', attachment.id)"
          >
            Remove
          </Button>
        </div>
      </li>
    </ul>

    <p class="text-xs c-[var(--vp-c-text-3)] mt-2">
      Pending local images are not restored after reload. Uploaded files may remain if submission fails.
    </p>
  </section>
</template>
