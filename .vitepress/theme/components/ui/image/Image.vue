<script setup lang="ts">
import type { ZoomOptions } from 'medium-zoom'
import type { DefaultTheme } from 'vitepress/theme-without-fonts'
import { useToggle } from '@vueuse/core'
import mediumZoom from 'medium-zoom'
import { withBase } from 'vitepress'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  useAttrs,
  useId,
  watch,
} from 'vue'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import LazyImage from './LazyImage.vue'

interface Props {
  image?: DefaultTheme.ThemeableImage
  alt?: string
  zoom?: ZoomOptions | false
  class?: string
  preload?: boolean
  thumbHash?: string
  width?: number
  height?: number
  autoSizes?: boolean
  placeholderSrc?: string
  /**
   * 是否显示骨架屏加载状态
   * @default true
   */
  showSkeleton?: boolean
  /**
   * 骨架屏样式类名
   */
  skeletonClass?: string
  /**
   * 容器样式类名
   */
  containerClass?: string
}

defineOptions({ inheritAttrs: false })

const {
  zoom: zoomConfig = { background: 'transparent' } as ZoomOptions,
  width = -1,
  height = -1,
  image,
  preload = false,
  thumbHash,
  autoSizes = true,
  showSkeleton = true,
  placeholderSrc,
} = defineProps<Props>()

const [isLoaded, toggleLoaded] = useToggle(false)
const [isLoadFail, toggleLoadFail] = useToggle(false)
const [isLoading, toggleLoading] = useToggle(false)
const [isRealImageReady, toggleRealImageReady] = useToggle(false)

const attrs = useAttrs()
const imgId = useId()

// 计算最终的图片源地址
const imgSrc = computed((): string => {
  // Priority: props.image > attrs.src > fallback
  const propsSrc = typeof image === 'string' ? image : image?.src
  if (propsSrc) {
    return propsSrc
  }

  const attrsSrc = attrs.src as string | undefined
  if (!attrsSrc) {
    return 'https://assets.yuanshen.site/images/noImage.png'
  }

  // Handle relative vs absolute paths
  return attrsSrc.startsWith('/') ? withBase(attrsSrc) : attrsSrc
})

// 判断是否应该使用懒加载
const shouldUseLazyLoading = computed(() => {
  return !preload && (thumbHash || placeholderSrc)
})

// 判断是否显示骨架屏
const shouldShowSkeleton = computed(() => {
  return showSkeleton
    && isLoading.value
    && !isLoaded.value
    && !isLoadFail.value
    && !thumbHash
    && !placeholderSrc
    && !shouldUseLazyLoading.value // 懒加载模式下不显示骨架屏
})

// 计算骨架屏样式
const skeletonStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (width > 0) {
    styles.width = `${width}px`
  }
  if (height > 0) {
    styles.height = `${height}px`
  }
  if (width > 0 && height > 0) {
    styles.aspectRatio = `${width} / ${height}`
  }

  return styles
})

const zoom = zoomConfig === false ? null : import.meta.env.SSR ? null : mediumZoom(zoomConfig)

async function initZoom() {
  if (import.meta.env.SSR) {
    return
  }

  await nextTick()

  const target = document.getElementById(imgId) as HTMLImageElement | undefined
  if (!target)
    return
  zoom?.attach(target)
}

function handleImageLoadStart() {
  toggleLoading(true)
  toggleLoadFail(false)
}

function handleLoaded(_image?: HTMLImageElement) {
  toggleLoaded(true)
  toggleLoading(false)
  toggleLoadFail(false)

  if (shouldUseLazyLoading.value) {
    const realImg = new Image()
    realImg.onload = () => {
      if (realImg.decode) {
        realImg.decode()
          .finally(() => {
            toggleRealImageReady(true)
            setTimeout(initZoom, 50)
          })
      }
      else {
        // 兼容不支持 decode() 的浏览器
        setTimeout(() => {
          toggleRealImageReady(true)
          setTimeout(initZoom, 50)
        }, 100)
      }
    }

    realImg.onerror = () => {
      toggleRealImageReady(true)
      setTimeout(initZoom, 50)
    }

    realImg.src = imgSrc.value
  }
  else {
    initZoom()
  }
}

function handleError(_event: Event) {
  toggleLoadFail(true)
  toggleLoading(false)
  toggleLoaded(false)
}

function handleImageLoad(event: Event) {
  handleLoaded(event.target as HTMLImageElement)
}

onMounted(() => {
  initZoom()
  // 如果不使用懒加载，立即开始加载
  if (!shouldUseLazyLoading.value) {
    handleImageLoadStart()
  }
})

onUnmounted(() => zoom?.detach())

watch(
  () => JSON.stringify(zoomConfig),
  () => zoom?.update(zoomConfig || {}),
)
</script>

<template>
  <div :class="cn('relative h-full w-full', containerClass)">
    <!-- 骨架屏占位符 -->
    <Skeleton
      v-if="shouldShowSkeleton"
      :class="cn('absolute inset-0 z-10', skeletonClass)"
      :style="skeletonStyles"
    />

    <!-- 懒加载模式 -->
    <template v-if="shouldUseLazyLoading">
      <!-- 懒加载占位符 (thumbHash 或 placeholderSrc) -->
      <Transition
        v-if="!isRealImageReady"
        name="image-placeholder"
        mode="out-in"
        :duration="{ enter: 200, leave: 400 }"
      >
        <LazyImage
          :src="imgSrc"
          :auto-sizes="autoSizes"
          :thumbhash="thumbHash"
          :preload="preload"
          :width="width > 0 ? width : undefined"
          :height="height > 0 ? height : undefined"
          :placeholder-src="placeholderSrc"
          :style="{
            aspectRatio: width > 0 && height > 0 ? `${width} / ${height}` : undefined,
          }"
          :class="cn('VPImage', $props.class)"
          @load-start="handleImageLoadStart"
          @loaded="handleLoaded"
          @error="handleError"
        />
      </Transition>

      <!-- 懒加载完成后的真实图片 -->
      <Transition
        name="image-reveal"
        mode="in-out"
        :duration="{ enter: 500, leave: 300 }"
        appear
      >
        <img
          v-if="isRealImageReady && !isLoadFail"
          v-bind="typeof image === 'string' ? $attrs : { ...image, ...$attrs }"
          :id="imgId"
          :src="imgSrc"
          :alt="alt ?? (typeof image === 'string' ? '' : image?.alt || '')"
          :class="cn('VPImage', $props.class)"
          :width="width > 0 ? width : undefined"
          :height="height > 0 ? height : undefined"
          :style="{
            aspectRatio: width > 0 && height > 0 ? `${width} / ${height}` : undefined,
          }"
          @error="handleError"
        >
      </Transition>
    </template>

    <!-- 直接加载模式 -->
    <template v-else>
      <Transition
        name="image-fade"
        mode="in-out"
        :duration="{ enter: 300, leave: 150 }"
        appear
      >
        <img
          v-if="!isLoadFail"
          v-bind="typeof image === 'string' ? $attrs : { ...image, ...$attrs }"
          :id="imgId"
          :src="imgSrc"
          :alt="alt ?? (typeof image === 'string' ? '' : image?.alt || '')"
          :class="cn('VPImage', $props.class)"
          :width="width > 0 ? width : undefined"
          :height="height > 0 ? height : undefined"
          :style="{
            aspectRatio: width > 0 && height > 0 ? `${width} / ${height}` : undefined,
          }"
          @load="handleImageLoad"
          @loadstart="handleImageLoadStart"
          @error="handleError"
        >
      </Transition>
    </template>

    <!-- 错误回退图片 -->
    <img
      v-if="isLoadFail"
      v-bind="typeof image === 'string' ? $attrs : { ...image, ...$attrs }"
      :class="cn('VPImage bg-[var(--vp-c-bg-alt)]', $props.class)"
      :alt="alt ?? (typeof image === 'string' ? '' : image?.alt || '')"
      src="https://assets.yuanshen.site/images/noImage.png"
      :width="width > 0 ? width : undefined"
      :height="height > 0 ? height : undefined"
      :style="{
        aspectRatio: width > 0 && height > 0 ? `${width} / ${height}` : undefined,
      }"
    >
  </div>
</template>

<style scoped>
html:not(.dark) .VPImage.dark {
  display: none;
}
.dark .VPImage.light {
  display: none;
}

/* 放大时的样式优化 */
:deep(.medium-zoom-overlay) {
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(4px);
}

/* 骨架屏样式优化 */
.relative .absolute {
  border-radius: inherit;
}

/* 响应式圆角处理 */
.VPImage {
  border-radius: min(8px, 4vw);
  transition: border-radius 0.3s ease;
}

/* 图片占位符动画 */
.image-placeholder-enter-active,
.image-placeholder-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.image-placeholder-enter-from {
  opacity: 0;
}

.image-placeholder-leave-to {
  opacity: 0;
}

/* 真实图片显示动画 - 平滑切换 */
.image-reveal-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.image-reveal-leave-active {
  transition: all 0.2s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

.image-reveal-enter-from {
  opacity: 0;
  filter: blur(4px);
}

.image-reveal-enter-to {
  opacity: 1;
  filter: blur(0px);
}

.image-reveal-leave-to {
  opacity: 0;
}

/* 直接加载模式的淡入动画 */
.image-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.image-fade-leave-active {
  transition: all 0.15s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

.image-fade-enter-from {
  opacity: 0;
  filter: blur(2px);
}

.image-fade-enter-to {
  opacity: 1;
  filter: blur(0px);
}

.image-fade-leave-to {
  opacity: 0;
}
</style>
