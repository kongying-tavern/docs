<script lang="ts" setup>
import { isArray } from 'lodash-es'
import { inject, ref } from 'vue'

import { uploadContextKey } from './upload'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits({
  file: (file: File[]) => isArray(file),
})

const uploaderContext = inject(uploadContextKey)

if (!uploaderContext) {
  throw new Error('usage: <PhotoWall><PhototUploadDragger /></PhotoWall>')
}

const dragover = ref(false)

function onDrop(e: DragEvent) {
  if (props.disabled)
    return
  dragover.value = false

  e.stopPropagation()

  const files = Array.from(e.dataTransfer!.files)
  emit('file', files)
}

function onDragover() {
  if (!props.disabled)
    dragover.value = true
}
</script>

<template>
  <div
    @drop.prevent="onDrop"
    @dragover.prevent="onDragover"
    @dragleave.prevent="dragover = false"
  >
    <slot />
  </div>
</template>
