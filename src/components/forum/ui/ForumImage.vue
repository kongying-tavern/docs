<script setup lang="ts">
import type { PreviewerContext } from './image-previewer/ForumImagePreviewer.vue'
import { useMediaQuery } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useBounceScroll } from '~/composables/useBounceScroll'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/services/forum/forumConfig'
import ForumImageItem from './ForumImageItem.vue'
import ForumImagePreviewer from './image-previewer/ForumImagePreviewer.vue'

export interface ImageItem {
  src: string
  alt?: string
  width?: number
  height?: number
  thumbHash?: string
  thumbhash?: string
}

type LayoutMode = 'auto' | 'single' | 'double' | 'triple' | 'quad' | 'gallery' | 'row'

interface Props {
  images: ImageItem[]
  layout?: LayoutMode
  maxDisplay?: number
  containerClass?: string
  imageClass?: string
  context?: PreviewerContext
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'auto',
  maxDisplay: 3,
  containerClass: '',
  imageClass: '',
})

const { message } = useLocalized()
const errorMap = ref(new Set<number>())
const readyMap = ref(new Set<number>())
const availableImages = computed(() => props.images
  .map((image, sourceIndex) => ({ image, sourceIndex }))
  .filter(({ sourceIndex }) => !errorMap.value.has(sourceIndex)))

const actualLayout = computed<Exclude<LayoutMode, 'auto'>>(() => {
  if (props.layout !== 'auto')
    return props.layout

  const count = availableImages.value.length
  const layoutMap: Record<number, Exclude<LayoutMode, 'auto'>> = {
    1: 'single',
    2: 'double',
    3: 'triple',
    4: 'quad',
  }
  return layoutMap[count] ?? 'gallery'
})

const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const isRail = computed(() => isMobile.value)

const railRef = useTemplateRef<HTMLElement>('railRef')
const railIndex = ref(0)
const railCount = computed(() => availableImages.value.length)
const showPrevArrow = computed(() => isRail.value && railIndex.value > 0)
const showNextArrow = computed(() => isRail.value && railIndex.value < railCount.value - 1)

useBounceScroll(railRef, { axis: 'x' })

const displayImages = computed(() => {
  if (isRail.value)
    return availableImages.value
  const layout = actualLayout.value
  if (layout === 'row')
    return availableImages.value.slice(0, props.maxDisplay)
  if (layout === 'gallery')
    return availableImages.value.slice(0, 4)
  return availableImages.value
})

const railItemWidth = computed(() => {
  if (typeof window === 'undefined')
    return 420
  return Math.min(window.innerWidth * 0.78, 420)
})

const railHeight = computed(() => {
  if (!isRail.value)
    return 400
  const sized = displayImages.value
    .map(({ image }) => image)
    .filter(image => Number(image.width) > 0 && Number(image.height) > 0)
  if (sized.length === 0)
    return 400
  const largest = sized.reduce((a, b) =>
    Number(a.width) * Number(a.height) >= Number(b.width) * Number(b.height) ? a : b)
  const ratio = Number(largest.height) / Number(largest.width)
  if (!Number.isFinite(ratio) || ratio <= 0)
    return 400
  const maxByViewport = typeof window === 'undefined'
    ? 560
    : Math.min(560, window.innerHeight * 0.75)
  return Math.min(Math.max(railItemWidth.value * ratio, 200), maxByViewport)
})

function railItemStyle(): Record<string, string> | undefined {
  if (!isRail.value)
    return undefined
  return { height: `${railHeight.value}px` }
}

function railStep(): number {
  const first = railRef.value?.firstElementChild as HTMLElement | null
  return first ? first.offsetWidth + 8 : 0 // gap-2
}

function onRailScroll() {
  const el = railRef.value
  const step = railStep()
  if (!el || step <= 0)
    return
  const index = Math.round(el.scrollLeft / step)
  if (index !== railIndex.value)
    railIndex.value = Math.min(Math.max(index, 0), railCount.value - 1)
}

function scrollRailTo(index: number) {
  const el = railRef.value
  const step = railStep()
  if (!el || step <= 0)
    return
  const target = Math.min(Math.max(index, 0), railCount.value - 1)
  el.scrollTo({ left: target * step, behavior: 'smooth' })
}

const remainingCount = computed(() => {
  if (isRail.value)
    return 0
  const layout = actualLayout.value
  if (layout === 'row')
    return availableImages.value.length - props.maxDisplay
  if (layout === 'gallery')
    return availableImages.value.length - 4
  return 0
})

const validImages = computed(() => availableImages.value.map(({ image }) => image))

function handleError(index: number) {
  errorMap.value.add(index)
}

function isPreviewReady(image: ImageItem, index: number): boolean {
  return !(image.thumbHash || image.thumbhash) || readyMap.value.has(index)
}

function handleReady(index: number) {
  readyMap.value = new Set(readyMap.value).add(index)
}

// @unocss-include
const layoutConfig = computed(() => {
  const layout = actualLayout.value

  // @unocss-include
  const containerStyles: Record<string, string> = {
    row: 'flex gap-4 max-w-[80%]',
    gallery: 'grid grid-cols-2 grid-rows-2 gap-0 max-h-[400px] rounded-lg overflow-hidden',
    single: 'grid grid-cols-1 max-h-[500px] gap-0',
    double: 'grid grid-cols-2 gap-0 max-h-[400px]',
    triple: 'grid grid-cols-2 grid-rows-2 h-[400px] gap-0',
    quad: 'grid grid-cols-2 grid-rows-2 max-h-[400px] rounded-lg overflow-hidden',
  }

  // @unocss-include
  const baseStyles = 'w-full h-full'
  // @unocss-include
  const cornerStyles: Record<string, Record<number, string>> = {
    single: { 0: 'rounded-lg max-h-[400px]' },
    double: { 0: 'rounded-l-lg', 1: 'rounded-r-lg' },
    triple: { 0: 'rounded-l-lg', 1: 'rounded-tr-lg', 2: 'rounded-br-lg' },
    quad: { 0: '', 1: '', 2: '', 3: '' },
    gallery: { 0: '', 1: '', 2: '', 3: '' },
  }

  const getItemStyle = (index: number): string => {
    if (isRail.value)
      return 'w-[78vw] max-w-[420px] shrink-0 snap-start rounded-xl'
    if (layout === 'row')
      return 'h-100px w-[30%] rounded'

    const cornerClass = cornerStyles[layout]?.[index] ?? ''
    return `${baseStyles} ${cornerClass}`
  }

  return {
    containerStyle: isRail.value
      ? 'forum-image-rail flex gap-2 overflow-x-auto'
      : containerStyles[layout] ?? '',
    getItemStyle,
  }
})

// @unocss-include
const tripleGridClasses = ['row-span-2', 'col-start-2 row-start-1', 'col-start-2 row-start-2']
</script>

<template>
  <ForumImagePreviewer
    v-if="validImages.length > 0"
    :images="validImages"
    :context="context"
    class="forum-image-previewer"
  >
    <template #default="{ openAt }">
      <div
        ref="railRef"
        :class="[layoutConfig.containerStyle, containerClass]"
        @scroll.passive="onRailScroll"
      >
        <button
          v-if="showPrevArrow"
          type="button"
          class="forum-image-rail-btn forum-image-rail-prev"
          :aria-label="message.forum.imagePreview.previous"
          @click="scrollRailTo(railIndex - 1)"
        >
          <span class="i-lucide-chevron-left" aria-hidden="true" />
        </button>

        <button
          v-for="({ image, sourceIndex }, index) in displayImages"
          :key="`${sourceIndex}:${image.src}`"
          type="button"
          class="p-0 border border-[var(--vp-c-divider)] bg-transparent transition-colors relative overflow-hidden hover:border-[var(--vp-c-brand)]"
          :class="[
            layoutConfig.getItemStyle(index),
            !isRail && actualLayout === 'triple' ? tripleGridClasses[index] : '',
            isPreviewReady(image, sourceIndex) ? 'cursor-zoom-in' : 'cursor-wait',
          ]"
          :style="railItemStyle()"
          :disabled="!isPreviewReady(image, sourceIndex)"
          :aria-label="message.forum.imagePreview.showImage.replace('{index}', String(index + 1))"
          @click="openAt(index, $event.currentTarget)"
        >
          <ForumImageItem
            :image="image"
            :fill-container="true"
            :class="imageClass"
            @error="handleError(sourceIndex)"
            @ready="handleReady(sourceIndex)"
          />

          <div
            v-if="index === displayImages.length - 1 && remainingCount > 0"
            class="text-xs text-[var(--forum-media-on-overlay)] px-1.5 py-0.5 rounded bg-[var(--forum-media-overlay)] right-1 top-1 absolute backdrop-blur-sm"
          >
            +{{ remainingCount }}
          </div>
        </button>

        <button
          v-if="showNextArrow"
          type="button"
          class="forum-image-rail-btn forum-image-rail-next"
          :aria-label="message.forum.imagePreview.next"
          @click="scrollRailTo(railIndex + 1)"
        >
          <span class="i-lucide-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </template>
  </ForumImagePreviewer>
</template>

<style scoped>
.grid:has(.row-span-2) {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.grid-cols-2.grid-rows-2 {
  height: 400px;
}

/* Grid 布局边框覆盖：使用负边距让相邻边框重叠 */
.grid > div {
  border: 1px solid var(--vp-c-divider);
  margin: -0.5px;
  z-index: 1;
}

.grid > div:hover {
  border-color: var(--vp-c-brand);
  z-index: 2;
}

@container (max-width: 500px) {
  .grid-cols-2 {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
  }

  .row-span-2 {
    grid-row: span 1 !important;
  }

  .grid-rows-2 {
    height: auto !important;
  }
}

.forum-image-rail {
  position: relative;
  padding-bottom: 10px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-snap-type: x proximity;
}

.forum-image-rail::-webkit-scrollbar {
  display: none;
}

.forum-image-rail-btn {
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  z-index: 4;
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  background: var(--forum-media-overlay);
  color: var(--forum-media-on-overlay);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.forum-image-rail-btn span {
  width: 18px;
  height: 18px;
}

.forum-image-rail-prev {
  left: 10px;
}

.forum-image-rail-next {
  right: 10px;
}

.forum-image-rail:hover .forum-image-rail-btn {
  opacity: 1;
}

.forum-image-rail-btn:hover {
  background: var(--forum-media-overlay-strong);
}
</style>
