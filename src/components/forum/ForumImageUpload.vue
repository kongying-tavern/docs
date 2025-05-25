<script setup lang="ts">
import type {
  UploadFile,
  UploadRawFile,
  UploadUserFile,
} from '@/components/ui/photo-wall/upload'
import type { HTMLAttributes } from 'vue'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import { PhotoWall } from '@/components/ui/photo-wall'
import { useVModel } from '@vueuse/core'
import { isArray } from 'lodash-es'
import { useTemplateRef } from 'vue'

const props = defineProps<{
  modelValue: UploadUserFile[]
  maxFileSize: number
  fileLimit: number
  placeholder?: string
  multiple?: boolean
  class?: HTMLAttributes['class']
  defaultValue?: UploadUserFile[]
  accept?: string[] | string
  uploadTips?: string
  hideDefaultTrigger?: boolean
  size?: 'xl' | 'lg'
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
  (e: 'upload', file: UploadFile): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const photoWallRef = useTemplateRef('photoWallRef')

async function handleFileChange(file: UploadFile) {
  emits('upload', file)
}

function handleStart(rawFile: UploadRawFile) {
  if (!photoWallRef.value?.handleStart)
    return
  return photoWallRef.value.handleStart(rawFile)
}

defineExpose({
  handleStart,
})
</script>

<template>
  <div class="mt-2">
    <PhotoWall
      ref="photoWallRef"
      v-model:file-list="modelValue"
      :limit="fileLimit"
      :accept="isArray(accept) ? accept?.map(val => `.${val.split('/')[1]}`).join(',') : accept"
      :multiple="multiple || true"
      :hide-default-trigger="hideDefaultTrigger || false"
      :on-change="handleFileChange"
      :size="size"
      default-state="uploading"
      v-bind="$attrs"
    >
      <span v-if="modelValue.length < fileLimit" i-lucide-image-plus />
      <span v-else i-lucide-image-off />
      <template v-if="fileLimit || uploadTips" #tip>
        <DynamicTextReplacer
          v-if="uploadTips"
          :data="uploadTips"
          tag="p"
          class="font-size-3 c-[var(--vp-c-text-2)]"
        >
          <template #range>
            <span>
              {{ fileLimit }}
            </span>
          </template>
          <template v-if="maxFileSize" #size>
            <span>{{ maxFileSize }}</span>
          </template>
        </DynamicTextReplacer>
      </template>
    </PhotoWall>
  </div>
</template>
