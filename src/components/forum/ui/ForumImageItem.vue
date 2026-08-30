<script setup lang="ts">
import type { ImageItem } from './ForumImage.vue'
import { computed, ref } from 'vue'
import LazyImage from '@/components/ui/image/LazyImage.vue'

const props = defineProps<{
  image: ImageItem
  /** 是否填充容器（grid 布局使用 object-cover） */
  fillContainer?: boolean
  class?: string
}>()

const emit = defineEmits<{
  error: []
  ready: []
}>()

const isRealImageReady = ref(false)

const hasError = ref(false)

const ERROR_IMAGE = 'https://assets.yuanshen.site/images/noImage.png'

const thumbHash = () => props.image.thumbHash || props.image.thumbhash

const useLazyLoad = () => !!thumbHash()

const imageClass = computed(() =>
  props.fillContainer ? 'object-cover' : 'object-contain',
)

function markRealImageReady() {
  if (isRealImageReady.value)
    return
  isRealImageReady.value = true
  emit('ready')
}

const aspectStyle = computed(() => {
  if (props.fillContainer || !props.image.width || !props.image.height)
    return {}
  return { aspectRatio: `${props.image.width} / ${props.image.height}` }
})

function preloadRealImage() {
  const img = new Image()
  img.onload = () => {
    img.decode?.()?.finally(markRealImageReady) ?? markRealImageReady()
  }
  img.onerror = () => {
    hasError.value = true
    emit('error')
  }
  img.src = props.image.src
}

function onLazyError() {
  hasError.value = true
  emit('error')
}
</script>

<template>
  <div
    class="size-full transition-all duration-200 relative overflow-hidden"
    :class="[hasError || (useLazyLoad() && !isRealImageReady) ? 'cursor-wait' : 'cursor-zoom-in', props.class]"
  >
    <template v-if="useLazyLoad()">
      <img
        v-if="hasError"
        :src="ERROR_IMAGE"
        :alt="image.alt || ''"
        class="bg-[var(--vp-c-bg-alt)] size-full"
        :class="imageClass"
        :style="aspectStyle"
      >

      <Transition
        v-else-if="!isRealImageReady"
        name="fade"
        mode="out-in"
      >
        <LazyImage
          :src="image.src"
          :thumbhash="thumbHash()"
          :width="image.width"
          :height="image.height"
          class="size-full"
          :class="imageClass"
          :style="aspectStyle"
          @loaded="preloadRealImage"
          @error="onLazyError"
        />
      </Transition>

      <Transition
        v-else
        name="reveal"
        mode="in-out"
        appear
      >
        <img
          :src="image.src"
          :alt="image.alt || ''"
          class="size-full transition-transform duration-200"
          :class="imageClass"
          :style="aspectStyle"
        >
      </Transition>
    </template>

    <img
      v-else
      :src="image.src"
      :alt="image.alt || ''"
      class="size-full transition-transform duration-200"
      :class="imageClass"
      :style="aspectStyle"
      loading="lazy"
    >
  </div>
</template>

<style scoped>
.cursor-zoom-in:hover img {
  transform: scale(1.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.reveal-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.reveal-leave-active {
  transition: opacity 0.2s ease;
}

.reveal-enter-from {
  opacity: 0;
  filter: blur(4px);
}

.reveal-leave-to {
  opacity: 0;
}
</style>
