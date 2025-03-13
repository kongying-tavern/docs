<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useFocus, useTextareaAutosize, useVModel } from '@vueuse/core'

const props = defineProps<{
  modelValue: string
  textLimit: number
  class?: HTMLAttributes['class']
  defaultValue?: string
  placeholder?: string
  isUploadDisabled?: boolean
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const { textarea, input } = useTextareaAutosize()
const { focused } = useFocus(textarea)
</script>

<template>
  <div class="flex">
    <div class="comment-area w-full">
      <div
        class="body border border-input rounded-md border-style-solid bg-transparent px-2 py-1 shadow-sm transition-colors placeholder:text-muted-foreground vp-border-input"
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
