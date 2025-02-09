<template>
  <div class="flex">
    <div class="comment-area w-full">
      <div
        class="body border-style-solid border rounded-md px-2 py-1 border-input bg-transparent shadow-sm transition-colors placeholder:text-muted-foreground vp-border-input"
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
            class="char-count w-full max-h-256px h-auto line-height-[32px] cursor-text font-size-3.5 bg-transparent resize-none"
            v-bind="$attrs"
            v-model.trim="input"
            :class="isUploadDisabled || false ? 'min-h-100px' : 'min-h-128px'"
            :maxlength="textLimit"
            :placeholder="placeholder"
          >
          </textarea>
          <span
            class="pos-absolute md:bottom-0 right-0 bottom-[-104px] c-[var(--vp-c-text-3)] font-size-[12px]"
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
          :fileLimit="fileLimit"
          :accept="accept"
          :multiple="multiple"
          :hideDefaultTrigger="isHideDefaultTrigger || false"
          :uploadTips="uploadTips"
          :max-file-size="3"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTextareaAutosize, useVModel, useFocus } from '@vueuse/core'
import { computed, watch, type HTMLAttributes } from 'vue'
import ForumImageUpload from '~/components/forum/ForumImageUpload.vue'
import { cn } from '@/lib/utils'
import type { UploadUserFile } from '@/components/ui/photo-wall/upload'

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
  set: (val) => (modelValue.value.images = val),
})

watch(input, () => (modelValue.value.text = input.value))
</script>

<style scoped>
textarea {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

textarea::-webkit-scrollbar {
  display: none;
}
</style>
