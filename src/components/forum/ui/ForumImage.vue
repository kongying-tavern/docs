<script setup lang="ts">
import type { PreviewerContext } from './image-previewer/ForumImagePreviewer.vue'
import { useElementSize, useMediaQuery } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useBounceScroll } from '~/composables/useBounceScroll'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/services/forum/forumConfig'
import { planForumImageGrid } from '~/services/forum/forumImageLayout'
import ForumImageIndicator from './ForumImageIndicator.vue'
import ForumImageItem from './ForumImageItem.vue'
import ForumImageNavigationButton from './ForumImageNavigationButton.vue'
import ForumImagePreviewer from './image-previewer/ForumImagePreviewer.vue'

export interface ImageItem {
  src: string
  alt?: string
  width?: number
  height?: number
  thumbHash?: string
  thumbhash?: string
}

type LayoutMode = 'auto' | 'single' | 'double' | 'triple' | 'quad' | 'gallery' | 'row' | 'thumbnail'

interface Props {
  images: ImageItem[]
  layout?: LayoutMode
  maxDisplay?: number
  containerClass?: string
  imageClass?: string
  context?: PreviewerContext
  previewEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'auto',
  maxDisplay: 3,
  containerClass: '',
  imageClass: '',
  previewEnabled: true,
})

const { message } = useLocalized()
const { reducedMotion } = useSitePreferences()
const errorMap = ref(new Set<number>())
const readyMap = ref(new Set<number>())
// errorMap/readyMap 以 images 下标为 key：列表被整体替换（如引用话题 refetch 重建）时，旧下标的记录必须作废
watch(() => props.images, () => {
  errorMap.value = new Set()
  readyMap.value = new Set()
})
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

const isRail = computed(() =>
  actualLayout.value !== 'thumbnail' && isMobile.value,
)

const railRef = useTemplateRef<HTMLElement>('railRef')
const { width: gridWidth } = useElementSize(railRef)
const railIndex = ref(0)
const railProgress = ref(0)

useBounceScroll(railRef, { axis: 'x' })

const isAdaptiveGrid = computed(() => !isRail.value && (
  actualLayout.value === 'thumbnail'
  || (props.layout === 'auto' && availableImages.value.length > 1)
))
const adaptiveImages = computed(() => availableImages.value.slice(
  0,
  actualLayout.value === 'thumbnail' ? Math.min(props.maxDisplay, 4) : 4,
))
const adaptiveAspect = computed(() => actualLayout.value === 'thumbnail'
  ? 1
  : Math.max(2, gridWidth.value / 400))
const adaptivePlan = computed(() => planForumImageGrid(
  adaptiveImages.value.map(({ image }) => image),
  adaptiveAspect.value,
))

const displayImages = computed(() => {
  const layout = actualLayout.value
  if (layout === 'row')
    return availableImages.value.slice(0, props.maxDisplay)
  if (isAdaptiveGrid.value)
    return adaptivePlan.value.order.map(index => adaptiveImages.value[index])
  if (isRail.value)
    return availableImages.value
  if (layout === 'gallery')
    return availableImages.value.slice(0, 4)
  return availableImages.value
})
const railCount = computed(() => displayImages.value.length)
const showPrevArrow = computed(() => isRail.value && railIndex.value > 0)
const showNextArrow = computed(() => isRail.value && railIndex.value < railCount.value - 1)

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
  const first = railRef.value?.querySelector<HTMLElement>('[data-forum-image-rail-item]')
  return first ? first.offsetWidth + 8 : 0 // gap-2
}

function onRailScroll() {
  const el = railRef.value
  const step = railStep()
  if (!el || step <= 0)
    return
  railProgress.value = Math.min(
    Math.max(el.scrollLeft / step, 0),
    railCount.value - 1,
  )
  const index = Math.round(railProgress.value)
  if (index !== railIndex.value)
    railIndex.value = Math.min(Math.max(index, 0), railCount.value - 1)
}

function scrollRailTo(index: number) {
  const el = railRef.value
  const step = railStep()
  if (!el || step <= 0)
    return
  const target = Math.min(Math.max(index, 0), railCount.value - 1)
  el.scrollTo({ left: target * step, behavior: reducedMotion.value ? 'auto' : 'smooth' })
}

watch([railCount, isRail], ([count, rail]) => {
  const nextIndex = rail ? Math.min(railIndex.value, Math.max(0, count - 1)) : 0
  railIndex.value = nextIndex
  railProgress.value = nextIndex
})

const remainingCount = computed(() => {
  const layout = actualLayout.value
  if (layout === 'row')
    return Math.max(0, availableImages.value.length - props.maxDisplay)
  if (isAdaptiveGrid.value)
    return Math.max(0, availableImages.value.length - adaptiveImages.value.length)
  if (isRail.value)
    return 0
  if (layout === 'gallery')
    return availableImages.value.length - 4
  return 0
})

const validImages = computed(() => availableImages.value.map(({ image }) => image))
const rowContainerStyle = computed<Record<string, string> | undefined>(() =>
  !isRail.value && actualLayout.value === 'row'
    ? { '--forum-image-columns': String(Math.max(1, displayImages.value.length)) }
    : undefined,
)

function handleError(index: number) {
  errorMap.value.add(index)
}

function previewIndexFor(sourceIndex: number): number {
  return availableImages.value.findIndex(image => image.sourceIndex === sourceIndex)
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

  if (isAdaptiveGrid.value) {
    return {
      containerStyle: `forum-image-adaptive-grid grid w-full rounded-lg overflow-hidden${layout === 'thumbnail' ? ' forum-image-adaptive-grid--square size-full' : ''}`,
      getItemStyle: () => 'size-full min-h-0 min-w-0',
    }
  }

  // @unocss-include
  const containerStyles: Record<string, string> = {
    row: 'forum-image-row grid gap-2 max-w-[80%]',
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
      return 'h-100px min-w-0 rounded'
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
      <div class="forum-image-layout">
        <ForumImageIndicator
          v-if="isRail && railCount > 1"
          class="forum-image-rail-indicator"
          tone="surface"
          continuous
          :progress="railProgress"
          :total="railCount"
          :aria-label="`${railIndex + 1} / ${railCount}`"
          :aria-labels="displayImages.map((_, index) => message.forum.imagePreview.showImage.replace('{index}', String(index + 1)))"
          @select="scrollRailTo"
        />

        <div
          :class="[
            isRail ? 'forum-image-rail-frame' : '',
            isRail ? containerClass : '',
            actualLayout === 'thumbnail' ? 'h-full' : '',
          ]"
        >
          <div
            ref="railRef"
            :class="[layoutConfig.containerStyle, isRail ? '' : containerClass]"
            :data-forum-grid-layout="isAdaptiveGrid ? adaptivePlan.layout : undefined"
            :style="rowContainerStyle"
            @scroll.passive="onRailScroll"
          >
            <component
              :is="previewEnabled ? 'button' : 'div'"
              v-for="({ image, sourceIndex }, index) in displayImages"
              :key="`${sourceIndex}:${image.src}`"
              :type="previewEnabled ? 'button' : undefined"
              data-forum-image-rail-item
              class="p-0 border border-[var(--forum-image-outline)] bg-transparent relative overflow-hidden"
              :class="[
                layoutConfig.getItemStyle(index),
                !isRail && !isAdaptiveGrid && actualLayout === 'triple' ? tripleGridClasses[index] : '',
                previewEnabled ? 'transition-colors hover:border-[var(--vp-c-brand)]' : '',
                previewEnabled ? (isPreviewReady(image, sourceIndex) ? 'cursor-zoom-in' : 'cursor-wait') : '',
              ]"
              :style="railItemStyle()"
              :disabled="previewEnabled && !isPreviewReady(image, sourceIndex) ? true : undefined"
              :aria-label="previewEnabled ? message.forum.imagePreview.showImage.replace('{index}', String(index + 1)) : undefined"
              @click="previewEnabled && openAt(previewIndexFor(sourceIndex), $event.currentTarget)"
            >
              <ForumImageItem
                :image="image"
                :fill-container="true"
                :interactive="previewEnabled"
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
            </component>
          </div>

          <ForumImageNavigationButton
            v-if="isRail"
            class="forum-image-rail-btn forum-image-rail-prev"
            direction="previous"
            size="small"
            :label="message.forum.imagePreview.previous"
            :visible="showPrevArrow"
            @click="scrollRailTo(railIndex - 1)"
          />

          <ForumImageNavigationButton
            v-if="isRail"
            class="forum-image-rail-btn forum-image-rail-next"
            direction="next"
            size="small"
            :label="message.forum.imagePreview.next"
            :visible="showNextArrow"
            @click="scrollRailTo(railIndex + 1)"
          />
        </div>
      </div>
    </template>
  </ForumImagePreviewer>
</template>

<style scoped>
.forum-image-row {
  grid-template-columns: repeat(var(--forum-image-columns), minmax(0, 1fr));
}

.forum-image-adaptive-grid {
  aspect-ratio: 2;
  max-height: 400px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.forum-image-adaptive-grid--square {
  aspect-ratio: 1;
  max-height: none;
}

.forum-image-adaptive-grid[data-forum-grid-layout='single'] {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.forum-image-adaptive-grid[data-forum-grid-layout='two-vertical'] {
  grid-template-rows: 1fr;
}

.forum-image-adaptive-grid[data-forum-grid-layout='two-horizontal'] {
  grid-template-columns: 1fr;
}

.forum-image-adaptive-grid[data-forum-grid-layout='three-left'] > :first-child {
  grid-row: span 2;
}

.forum-image-adaptive-grid[data-forum-grid-layout='three-top'] > :first-child {
  grid-column: span 2;
}

.forum-image-rail-indicator {
  min-height: 20px;
  justify-content: flex-start;
  padding: 6px 0;
  margin-bottom: 4px;
}

.forum-image-rail-frame {
  position: relative;
}

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
}

.forum-image-rail-prev {
  left: 10px;
}

.forum-image-rail-next {
  right: 10px;
}
</style>
