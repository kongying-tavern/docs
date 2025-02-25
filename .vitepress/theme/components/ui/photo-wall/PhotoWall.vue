<script lang="ts" setup>
import type { UploadPhotoInstance, UploadPhotoProps } from './uploadPhoto'
import { computed, onBeforeUnmount, provide, ref, shallowRef } from 'vue'
import PhotoList from './PhotoList.vue'
import { uploadContextKey, uploadProps, uploadVariants } from './upload'
import UploadPhoto from './UploadPhoto.vue'
import { useHandlers } from './useHandlers'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps(uploadProps)

const disabled = ref(false)

const uploadRef = shallowRef<UploadPhotoInstance>()
const {
  uploadFiles,
  clearFiles,
  handleStart,
  handleRemove,
  revokeFileObjectURL,
} = useHandlers(props, uploadRef)

const uploadPhotoProps = computed<UploadPhotoProps>(() => ({
  ...props,
  fileList: uploadFiles.value,
  onStart: handleStart,
  onRemove: handleRemove,
}))

onBeforeUnmount(() => {
  uploadFiles.value.forEach(revokeFileObjectURL)
})

provide(uploadContextKey, {
  accept: computed(() => props.accept),
})

defineExpose({
  /** @description clear the file list  */
  clearFiles,
  /** @description select the file manually */
  handleStart,
  /** @description remove the file manually */
  handleRemove,
})
</script>

<template>
  <div>
    <PhotoList
      :disabled="disabled"
      :files="uploadFiles"
      :handle-preview="onPreview"
      :class="uploadVariants.size[size]"
      @remove="handleRemove"
    >
      <template v-if="$slots.file" #default="{ file, index }">
        <slot name="file" :file="file" :index="index" />
      </template>
      <template #append>
        <UploadPhoto
          v-if="!hideDefaultTrigger"
          ref="uploadRef"
          v-bind="uploadPhotoProps"
        >
          <slot v-if="$slots.trigger" name="trigger" />
          <slot v-if="!$slots.trigger && $slots.default" />
        </UploadPhoto>
      </template>
    </PhotoList>

    <slot v-if="$slots.trigger" />
    <slot name="tip" />
  </div>
</template>
