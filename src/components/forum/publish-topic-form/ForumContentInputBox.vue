<script setup lang="ts">
import type { UploadUserFile } from '@/components/ui/photo-wall/upload'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useFocus, useTextareaAutosize, useVModel } from '@vueuse/core'
import { computed, watch } from 'vue'

import ForumImageUpload from '~/components/forum/ForumImageUpload.vue'

interface Content {
  text: string
  images?: UploadUserFile[]
}

const props = defineProps<{
  modelValue: Content
  class?: HTMLAttributes['class']
  defaultValue?: Content
  placeholder?: string
  accept?: string
  multiple?: boolean
  textLimit?: number
  maxFileSize?: number
  fileLimit?: number
  autoUpload?: boolean
  uploadTips?: string
  isHideDefaultTrigger?: boolean
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

const imagesModel = computed({
  get: () => modelValue.value.images || [],
  set: val => (modelValue.value.images = val),
})

watch(input, () => (modelValue.value.text = input.value))
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
            props.class,
          )
        "
      >
        <div class="editor relative">
          <textarea
            ref="textarea"
            v-bind="$attrs"
            v-model.trim="input"
            class="h-auto max-h-256px w-full cursor-text resize-none bg-transparent font-size-3.5 line-height-[32px] char-count"
            :class="isUploadDisabled || false ? 'min-h-100px' : 'min-h-128px'"
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
        <ForumImageUpload
          v-if="isUploadDisabled"
          v-model="imagesModel"
          :file-limit="fileLimit"
          :accept="accept"
          :multiple="multiple"
          :hide-default-trigger="isHideDefaultTrigger || false"
          :upload-tips="uploadTips"
          :max-file-size="3"
        />
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
