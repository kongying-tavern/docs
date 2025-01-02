<template>
  <TransitionGroup name="list" tag="ul" class="flex w-[fit-content]">
    <li
      class="size-18 rounded-sm mr-2 overflow-hidden relative"
      v-for="(file, index) in files"
      :key="file.uid || file.name"
      :class="[{ focusing }, stateStyle[file.status!]]"
      tabindex="0"
      @keydown.delete="!disabled && handleRemove(file)"
      @focus="focusing = true"
      @blur="focusing = false"
      @click="focusing = false"
    >
      <slot :file="file" :index="index">
        <button
          class="absolute top-0 right-0 size-5 bg-[#0003] flex justify-center items-center rounded-bl-sm"
          v-if="!disabled && file.status !== 'uploading'"
          @click="handleRemove(file)"
        >
          <span class="i-lucide-x size-3.5 bg-white"></span>
        </button>
        <button
          class="absolute top-0 right-0 size-5 bg-[#0003] flex justify-center items-center rounded-bl-sm"
          v-if="!disabled && file.status === 'uploading'"
          @click="handleRemove(file)"
        >
          <span
            class="i-lucide-loader-circle animate-spin size-3.5 bg-white hover-animate-none"
          ></span>
        </button>
        <img
          class="size-100% object-cover"
          :src="file.url"
          :alt="file.name"
          @error="file.status = 'fail'"
        />
      </slot>
    </li>
    <slot name="append" />
  </TransitionGroup>
</template>
<script lang="ts" setup>
import { NOOP, mutable } from '@/components/type'
import { ref } from 'vue'
import {
  type UploadFile,
  type UploadFiles,
  type UploadHooks,
  type UploadStatus,
  definePropType,
} from './upload'

const props = defineProps({
  files: {
    type: definePropType<UploadFiles>(Array),
    default: () => mutable([]),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  handlePreview: {
    type: definePropType<UploadHooks['onPreview']>(Function),
    default: NOOP,
  },
})

const emit = defineEmits({
  remove: (file: UploadFile) => !!file,
})

const focusing = ref(false)

const stateStyle: { [K in UploadStatus]: string } = {
  ready: 'ready',
  uploading: 'uploading',
  fail: 'border',
  success: 'success',
}

const handleRemove = (file: UploadFile) => {
  emit('remove', file)
}
</script>
