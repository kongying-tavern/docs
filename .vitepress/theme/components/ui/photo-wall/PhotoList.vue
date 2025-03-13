// @unocss-include
<script lang="ts" setup>
import type {
  UploadFile,
  UploadFiles,
  UploadHooks,
  UploadStatus,
} from './upload'
import { mutable, NOOP } from '@/components/type'
import { ref } from 'vue'
import { definePropType } from './upload'

defineOptions({
  inheritAttrs: false,
})

defineProps({
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

function handleRemove(file: UploadFile) {
  emit('remove', file)
}
</script>

<template>
  <TransitionGroup name="list" tag="ul" class="w-[fit-content] flex">
    <li
      v-for="(file, index) in files"
      :key="file.uid || file.name"
      class="relative size-18 overflow-hidden rounded-sm"
      :class="[{ focusing }, stateStyle[file.status!]]"
      tabindex="0"
      v-bind="$attrs"
      @keydown.delete="!disabled && handleRemove(file)"
      @focus="focusing = true"
      @blur="focusing = false"
      @click="focusing = false"
    >
      <slot :file="file" :index="index">
        <button
          v-if="!disabled && file.status !== 'uploading'"
          class="absolute right-0 top-0 size-5 flex items-center justify-center rounded-bl-sm bg-[#0003]"
          @click="handleRemove(file)"
        >
          <span class="i-lucide-x size-3.5 bg-white" />
        </button>
        <button
          v-if="!disabled && file.status === 'uploading'"
          class="absolute right-0 top-0 size-5 flex items-center justify-center rounded-bl-sm bg-[#0003]"
          @click="handleRemove(file)"
        >
          <span
            class="i-lucide-loader-circle size-3.5 animate-spin bg-white hover-animate-none"
          />
        </button>
        <img
          class="size-100% object-cover"
          :src="file.status === 'fail' ? 'https://assets.yuanshen.site/images/noImage.png' : file.url"
          :alt="file.name"
          @error="$event => file.status = 'fail'"
        >
      </slot>
    </li>
    <slot name="append" />
  </TransitionGroup>
</template>
