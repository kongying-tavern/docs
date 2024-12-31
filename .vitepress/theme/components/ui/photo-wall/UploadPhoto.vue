<template>
  <div
    class="size-18 rounded-sm mr-2 overflow-hidden relative border-dashed border flex justify-center items-center"
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
      class="hidden"
      ref="inputRef"
      :name="name"
      :disabled="disabled || fileList.length === limit"
      :maxlength="limit"
      :multiple="multiple"
      :accept="accept"
      type="file"
      @change="handleChange"
      @click.stop
    />
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import { genFileId } from './upload'
import { uploadPhotoProps } from './uploadPhoto'
import UploadPhotoDragger from './UploadPhotoDragger.vue'

import type { UploadRawFile } from './upload'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps(uploadPhotoProps)

const inputRef = shallowRef<HTMLInputElement>()

const uploadFiles = (files: File[]) => {
  if (files.length === 0) return

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

const handleChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  uploadFiles(Array.from(files))
}

const handleClick = () => {
  if (!props.disabled) {
    inputRef.value!.value = ''
    inputRef.value!.click()
  }
}

const handleKeydown = () => {
  handleClick()
}
</script>
