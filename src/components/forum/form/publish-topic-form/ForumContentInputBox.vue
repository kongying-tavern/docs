<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useFocus, useTextareaAutosize, useVModel } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { cn } from '@/lib/utils'
import { useClipboardPaste } from '~/composables/useClipboardPaste'

const props = defineProps<{
  modelValue: string
  textLimit: number
  class?: HTMLAttributes['class']
  defaultValue?: string
  placeholder?: string
  isUploadDisabled?: boolean
  supportPaste?: boolean
  accept?: string[]
  maxFileSize?: number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
  (e: 'paste-files', files: File[]): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const { textarea, input } = useTextareaAutosize()
const { focused } = useFocus(textarea)

const container = useTemplateRef('container')
const stopClipboardListener = ref<(() => void) | null>(null)

const { startListening } = useClipboardPaste({
  accept: props.accept || ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  maxFileSize: (props.maxFileSize || 3) * 1024 * 1024,
  onPaste: (files) => {
    if (!props.isUploadDisabled) {
      emits('paste-files', files)
    }
  },
})

onMounted(() => {
  if (props.supportPaste && container.value && !props.isUploadDisabled) {
    stopClipboardListener.value = startListening(container.value)
  }
})

onBeforeUnmount(() => {
  if (stopClipboardListener.value) {
    stopClipboardListener.value()
  }
})
</script>

<template>
  <div ref="container" class="flex">
    <div class="comment-area w-full">
      <div
        class="body border vp-border-input border-input rounded-md border-style-solid bg-transparent px-2 py-1 shadow-sm transition-colors placeholder:text-muted-foreground"
        :class="
          cn(
            focused
              ? 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              : '',
          )
        "
      >
        <div class="editor relative">
          <textarea
            ref="textarea"
            v-bind="$attrs"
            v-model.trim="modelValue"
            :class="cn('h-auto max-h-256px w-full cursor-text resize-none bg-transparent font-size-3.5 line-height-[32px] char-count', props.class)"
            :maxlength="textLimit"
            :placeholder="placeholder"
          />
          <span
            class="pos-absolute bottom-[-104px] right-0 font-size-[12px] c-[var(--vp-c-text-3)] md:bottom-0"
          >
            <span :class="input?.length >= (textLimit || -1) ? 'c-red' : ''">
              {{ input?.length || 0 }}
            </span>
            / {{ textLimit }}
          </span>
        </div>
        <slot name="uploader" />
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

textarea::-webkit-scrollbar {
  display: none;
}
</style>
