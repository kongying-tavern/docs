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
  click: []
  error: []
}>()

/** 真实图片加载状态 */
const isRealImageReady = ref(false)

/** 加载错误状态 */
const hasError = ref(false)

/** 错误图片地址 */
const ERROR_IMAGE = 'https://assets.yuanshen.site/images/noImage.png'

/** 获取 thumbhash 值 */
const thumbHash = () => props.image.thumbHash || props.image.thumbhash

/** 是否使用懒加载 */
const useLazyLoad = () => !!thumbHash()

/** 图片样式 */
const imageClass = computed(() =>
  props.fillContainer ? 'object-cover' : 'object-contain',
)

/** 图片宽高比样式 */
const aspectStyle = computed(() => {
  if (props.fillContainer || !props.image.width || !props.image.height)
    return {}
  return { aspectRatio: `${props.image.width} / ${props.image.height}` }
})

/** 预加载真实图片 */
function preloadRealImage() {
  const img = new Image()
  img.onload = () => {
    img.decode?.()?.finally(() => {
      isRealImageReady.value = true
    }) ?? (isRealImageReady.value = true)
  }
  img.onerror = () => {
    hasError.value = true
    emit('error')
  }
  img.src = props.image.src
}

/** LazyImage 加载错误 */
function onLazyError() {
  hasError.value = true
  emit('error')
}

function onClick() {
  if (!hasError.value)
    emit('click')
}
</script>

<template>
  <div
    class="size-full transition-all duration-200 relative overflow-hidden"
    :class="[hasError ? 'cursor-not-allowed' : 'cursor-zoom-in', props.class]"
    @click="onClick"
  >
    <!-- 懒加载模式 -->
    <template v-if="useLazyLoad()">
      <!-- 错误状态 -->
      <img
        v-if="hasError"
        :src="ERROR_IMAGE"
        :alt="image.alt || ''"
        class="bg-[var(--vp-c-bg-alt)] size-full"
        :class="imageClass"
        :style="aspectStyle"
      >

      <!-- Thumbhash 占位符 -->
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

      <!-- 真实图片 -->
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

    <!-- 直接加载模式 -->
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
/* 悬停缩放 */
.cursor-zoom-in:hover img {
  transform: scale(1.05);
}

/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 图片显示动画 */
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
