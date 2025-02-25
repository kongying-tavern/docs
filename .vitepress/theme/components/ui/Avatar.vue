<script setup lang="ts">
import type { PropType } from 'vue'

import { twJoin, twMerge } from 'tailwind-merge'
import { computed, ref, watch } from 'vue'
import { UI } from './config'

const props = defineProps({
  as: {
    type: [String, Object],
    default: 'img',
  },
  src: {
    type: [String, Boolean],
    default: null,
  },
  alt: {
    type: String,
    default: null,
  },
  text: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: () => '',
  },
  size: {
    type: String as () => 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    default: () => UI.Avatar.default.size,
    validator(value: string) {
      return Object.keys(UI.Avatar.size).includes(value)
    },
  },
  chipText: {
    type: [String, Number],
    default: null,
  },
  imgClass: {
    type: String,
    default: '',
  },
  class: {
    type: [String, Object, Array] as PropType<any>,
    default: () => '',
  },
})

const imgClass = computed(() => {
  return twMerge(
    twJoin(UI.Avatar.rounded, UI.Avatar.size[props.size]),
    props.imgClass,
  )
})

const iconClass = computed(() => {
  return twJoin(UI.Avatar.icon.base, UI.Avatar.icon.size[props.size])
})

const url = computed(() => {
  if (typeof props.src === 'boolean') {
    return null
  }
  return props.src
})

const error = ref(false)

const wrapperClass = computed(() => {
  return twMerge(
    twJoin(
      UI.Avatar.wrapper,
      (error.value || !url.value) && UI.Avatar.background,
      UI.Avatar.rounded,
      UI.Avatar.size[props.size],
    ),
    props.class,
  )
})

watch(
  () => props.src,
  () => {
    if (error.value) {
      error.value = false
    }
  },
)

function onError() {
  error.value = true
}

const placeholder = computed(() => {
  return (props.alt || '')
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
})
</script>

<template>
  <div class="Avatar" :class="wrapperClass">
    <component
      :is="as"
      v-if="url && !error"
      class="avatar-image"
      :class="imgClass"
      :alt="alt"
      :src="url"
      @error="onError"
    />
    <span v-else-if="text">{{ text }}</span>
    <span v-else-if="icon" :class="(icon, iconClass)" />
    <span v-else-if="placeholder" class="avatar-placeholder">{{
      placeholder
    }}</span>
  </div>
</template>
