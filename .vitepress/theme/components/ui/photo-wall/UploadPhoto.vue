<script lang="ts" setup>
import type { UploadRawFile } from './upload'

import { shallowRef } from 'vue'
import { genFileId, uploadVariants } from './upload'
import { uploadPhotoProps } from './uploadPhoto'

import UploadPhotoDragger from './UploadPhotoDragger.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps(uploadPhotoProps)

const inputRef = shallowRef<HTMLInputElement>()

function uploadFiles(files: File[]) {
  if (files.length === 0)
    return

  const { limit, fileList, multiple, onExceed, onStart } = props

  if (limit && fileList.length + files.length > limit) {
    onExceed(files, fileList)
    return
  }

  if (!multiple) {
    files = files.slice(0, 1)
  }

  for (const file of files) {
    const rawFile = file as UploadRawFile
    rawFile.uid = genFileId()
    onStart(rawFile)
    inputRef.value!.value = ''
  }
}

function handleChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files)
    return
  uploadFiles(Array.from(files))
}

function handleClick() {
  if (!props.disabled) {
    inputRef.value!.value = ''
    inputRef.value!.click()
  }
}

function handleKeydown() {
  handleClick()
}
</script>

<template>
  <div
    class="relative size-full flex items-center justify-center overflow-hidden border rounded-sm border-dashed"
    :class="uploadVariants.size[size]"
    :tabindex="disabled ? '-1' : '0'"
    @click="handleClick"
    @keydown.self.enter.space="handleKeydown"
  >
    <template v-if="drag">
      <UploadPhotoDragger :disabled="disabled" @file="uploadFiles">
        <slot />
      </UploadPhotoDragger>
    </template>
    <template v-else>
      <slot />
    </template>
    <input
      ref="inputRef"
      class="hidden"
      :name="name"
      :disabled="disabled || fileList.length === limit"
      :maxlength="limit"
      :multiple="multiple"
      :accept="accept"
      type="file"
      @change="handleChange"
      @click.stop
    >
  </div>
</template>
