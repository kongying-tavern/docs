<script setup lang="ts">
import type { PreviewImage } from '../ForumImagePreviewer.vue'
import { useElementSize, useMediaQuery } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { image, zoomEnabled = true, maxZoom = 4 } = defineProps<{ image: PreviewImage, zoomEnabled?: boolean, maxZoom?: number }>()
const emit = defineEmits<{ dimensions: [size: { width: number, height: number }] }>()
const { t } = useI18n({ useScope: 'global' })
const viewport = useTemplateRef<HTMLElement>('viewport')
const imageElement = useTemplateRef<HTMLImageElement>('imageElement')
const navigator = useTemplateRef<HTMLElement>('navigator')
const isDesktop = useMediaQuery('(min-width: 960px)')
const { width, height } = useElementSize(viewport)
const zoom = ref(1)
const navigating = ref(false)
const canScrollDown = ref(false)
const canScrollUp = ref(false)
const scrollFade = computed(() => {
  if (isDesktop.value)
    return undefined
  const edge = canScrollUp.value && canScrollDown.value
    ? 'scroll-fade'
    : canScrollUp.value ? 'scroll-fade-t' : canScrollDown.value ? 'scroll-fade-b' : ''
  return edge ? `${edge} scroll-fade-8` : undefined
})
const imageWidth = computed(() => Math.min(image.width ?? width.value, width.value) * zoom.value)
const navigatorWidth = computed(() => Math.min(80, height.value * Number(image.width) / Number(image.height)))
const windowRect = ref({ left: 0, top: 0, width: 1, height: 1 })
const windowStyle = computed(() => ({
  left: `${windowRect.value.left * 100}%`,
  top: `${windowRect.value.top * 100}%`,
  width: `${windowRect.value.width * 100}%`,
  height: `${windowRect.value.height * 100}%`,
}))
const readingPosition = computed(() => windowRect.value.height < 1
  ? Math.round(windowRect.value.top / (1 - windowRect.value.height) * 100)
  : 0)
let navigationDrag: { id: number, x: number, y: number } | undefined
let pinch: { distance: number, zoom: number } | undefined
let imageClick: { x: number, y: number, top: number, left: number, moved: boolean } | undefined

const clamp = (value: number, max = 1) => Math.max(0, Math.min(value, max))

function syncWindow() {
  const el = viewport.value
  const img = imageElement.value
  if (!el || !img)
    return
  canScrollDown.value = el.scrollHeight - el.clientHeight - el.scrollTop > 1
  canScrollUp.value = el.scrollTop > 1
  const imageRect = img.getBoundingClientRect()
  if (!imageRect.width || !imageRect.height)
    return
  const viewportRect = el.getBoundingClientRect()
  const visibleWidth = Math.min(1, el.clientWidth / imageRect.width)
  const visibleHeight = Math.min(1, el.clientHeight / imageRect.height)
  windowRect.value = {
    left: clamp((viewportRect.left - imageRect.left) / imageRect.width, 1 - visibleWidth),
    top: clamp((viewportRect.top - imageRect.top) / imageRect.height, 1 - visibleHeight),
    width: visibleWidth,
    height: visibleHeight,
  }
}

watch([width, height, zoom, () => image.width, () => image.height], () => nextTick(syncWindow))

function imageLoaded() {
  const img = imageElement.value
  if (img?.naturalWidth && img.naturalHeight)
    emit('dimensions', { width: img.naturalWidth, height: img.naturalHeight })
  nextTick(syncWindow)
}

function navigate(event: PointerEvent) {
  const el = viewport.value
  const img = imageElement.value
  const map = navigator.value
  if (!el || !img || !map || navigationDrag?.id !== event.pointerId)
    return
  const mapRect = map.getBoundingClientRect()
  const imageRect = img.getBoundingClientRect()
  if (!imageRect.width || !imageRect.height)
    return
  const viewportRect = el.getBoundingClientRect()
  const left = clamp((event.clientX - mapRect.left) / mapRect.width - navigationDrag.x, 1 - windowRect.value.width)
  const top = clamp((event.clientY - mapRect.top) / mapRect.height - navigationDrag.y, 1 - windowRect.value.height)
  el.scrollTo({
    left: imageRect.left - viewportRect.left + el.scrollLeft + left * imageRect.width,
    top: imageRect.top - viewportRect.top + el.scrollTop + top * imageRect.height,
  })
  syncWindow()
}

function startNavigation(event: PointerEvent) {
  if (event.button !== 0 || !navigator.value)
    return
  event.preventDefault()
  navigator.value.focus()
  const rect = navigator.value.getBoundingClientRect()
  const onWindow = (event.target as Element).classList.contains('forum-long-reader-window')
  navigationDrag = {
    id: event.pointerId,
    x: onWindow ? (event.clientX - rect.left) / rect.width - windowRect.value.left : windowRect.value.width / 2,
    y: onWindow ? (event.clientY - rect.top) / rect.height - windowRect.value.top : windowRect.value.height / 2,
  }
  navigating.value = true
  navigator.value.setPointerCapture(event.pointerId)
  navigate(event)
}

function endNavigation(event: PointerEvent) {
  if (navigationDrag?.id !== event.pointerId)
    return
  navigationDrag = undefined
  navigating.value = false
  if (navigator.value?.hasPointerCapture(event.pointerId))
    navigator.value.releasePointerCapture(event.pointerId)
}

function navigationKey(event: KeyboardEvent) {
  const el = viewport.value
  if (!el)
    return
  const vertical = ({ ArrowUp: -40, ArrowDown: 40, PageUp: -el.clientHeight, PageDown: el.clientHeight } as Record<string, number>)[event.key]
  if (vertical !== undefined)
    el.scrollTop += vertical
  else if (event.key === 'Home' || event.key === 'End')
    el.scrollTop = event.key === 'Home' ? 0 : el.scrollHeight
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    el.scrollLeft += event.key === 'ArrowLeft' ? -40 : 40
  else
    return
  event.preventDefault()
  event.stopPropagation()
  syncWindow()
}

async function changeZoom(value: number, point?: { x: number, y: number }) {
  const el = viewport.value
  const img = imageElement.value
  if (!el || !img || !zoomEnabled || imageWidth.value <= 0)
    return
  const viewportRect = el.getBoundingClientRect()
  const imageRect = img.getBoundingClientRect()
  if (!imageRect.width || !imageRect.height)
    return
  const anchor = point ?? { x: viewportRect.left + el.clientWidth / 2, y: viewportRect.top + el.clientHeight / 2 }
  const sourceX = (anchor.x - imageRect.left) / imageRect.width
  const sourceY = (anchor.y - imageRect.top) / imageRect.height
  zoom.value = Math.min(Math.max(1, maxZoom), Math.max(1, value))
  await nextTick()
  const nextRect = img.getBoundingClientRect()
  el.scrollTop += nextRect.top + sourceY * nextRect.height - anchor.y
  el.scrollLeft += nextRect.left + sourceX * nextRect.width - anchor.x
  syncWindow()
}

function beginImageClick(event: PointerEvent) {
  const el = viewport.value
  imageClick = isDesktop.value && event.pointerType === 'mouse' && event.button === 0 && event.target === imageElement.value && el
    ? { x: event.clientX, y: event.clientY, top: el.scrollTop, left: el.scrollLeft, moved: false }
    : undefined
}

function trackImageClick(event: PointerEvent) {
  if (imageClick && Math.hypot(event.clientX - imageClick.x, event.clientY - imageClick.y) >= 6)
    imageClick.moved = true
}

function toggleZoom(point?: { x: number, y: number }) {
  if (isDesktop.value)
    changeZoom(zoom.value > 1 ? 1 : 2, point)
}

function clickImage(event: PointerEvent) {
  const start = imageClick
  imageClick = undefined
  const el = viewport.value
  if (!start || !el || event.pointerType !== 'mouse' || start.moved
    || Math.abs(el.scrollTop - start.top) > 1 || Math.abs(el.scrollLeft - start.left) > 1) {
    return
  }
  toggleZoom({ x: event.clientX, y: event.clientY })
}

function wheel(event: WheelEvent) {
  if ((event.ctrlKey || event.metaKey) && zoomEnabled) {
    event.preventDefault()
    changeZoom(zoom.value * Math.exp(-event.deltaY * 0.0015), { x: event.clientX, y: event.clientY })
  }
}

function touchStart(event: TouchEvent) {
  if (event.touches.length === 2 && zoomEnabled) {
    event.preventDefault()
    pinch = { distance: Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY), zoom: zoom.value }
  }
}

function touchMove(event: TouchEvent) {
  if (pinch && event.touches.length === 2) {
    event.preventDefault()
    const distance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY)
    changeZoom(pinch.zoom * distance / Math.max(1, pinch.distance), {
      x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
      y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
    })
  }
}
function scrollToEdge(bottom: boolean) {
  if (viewport.value) {
    viewport.value.scrollTop = bottom ? viewport.value.scrollHeight : 0
    syncWindow()
  }
}
defineExpose({ changeZoom, scrollToEdge, zoom })
</script>

<template>
  <div class="forum-long-reader" @wheel.stop="wheel" @pointerdown.stop @pointermove.stop @pointerup.stop @pointercancel.stop @click.stop>
    <div v-if="isDesktop" class="forum-long-reader-map-rail">
      <div
        ref="navigator"
        class="forum-long-reader-map"
        :class="{ dragging: navigating }"
        :style="{ width: `${navigatorWidth}px`, aspectRatio: `${image.width} / ${image.height}` }"
        role="slider"
        tabindex="0"
        aria-orientation="vertical"
        :aria-label="t('forum.imagePreview.longImageNavigator')"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="readingPosition"
        @pointerdown="startNavigation"
        @pointermove="navigate"
        @pointerup="endNavigation"
        @pointercancel="endNavigation"
        @lostpointercapture="endNavigation"
        @keydown="navigationKey"
      >
        <img :src="image.src" alt="" aria-hidden="true" draggable="false">
        <div class="forum-long-reader-window" :style="windowStyle" />
      </div>
    </div>
    <div
      ref="viewport"
      class="forum-long-reader-viewport"
      :class="scrollFade"
      tabindex="0"
      :aria-label="t('forum.imagePreview.longImage')"
      @scroll.passive="syncWindow"
      @pointerdown="beginImageClick"
      @pointermove="trackImageClick"
      @pointerup="trackImageClick"
      @pointercancel="imageClick = undefined"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="pinch = undefined"
      @touchcancel="pinch = undefined"
    >
      <img
        ref="imageElement"
        :src="image.src"
        :alt="image.alt || ''"
        :width="image.width"
        :height="image.height"
        :style="{ width: `${imageWidth}px` }"
        draggable="false"
        :class="isDesktop && zoomEnabled ? zoom > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in' : undefined"
        @click="clickImage"
        @load="imageLoaded"
      >
    </div>
  </div>
</template>

<style scoped>
.forum-long-reader {
  display: flex;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
  pointer-events: auto;
  touch-action: auto;
}
.forum-long-reader-viewport {
  @apply panel-scrollbar;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  border-radius: 8px;
  scrollbar-gutter: stable;
}
@media (min-width: 960px) and (hover: hover) and (pointer: fine) {
  .forum-long-reader-viewport:not(:hover) {
    --panel-scrollbar-color: transparent;
    scrollbar-color: transparent transparent;
  }
}
.forum-long-reader-map-rail {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  flex-shrink: 0;
}
.forum-long-reader-map {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  touch-action: none;
}
.forum-long-reader-map img {
  display: block;
  width: 100%;
  height: 100%;
}
.forum-long-reader-window {
  position: absolute;
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--forum-media-on-overlay) 35%, transparent);
  box-shadow: 0 0 0 100vmax var(--forum-media-overlay);
  cursor: grab;
}
.forum-long-reader-map.dragging,
.forum-long-reader-map.dragging .forum-long-reader-window {
  cursor: grabbing;
}
.forum-long-reader-viewport img {
  display: block;
  max-width: none;
  height: auto;
  margin: 0 auto;
}
</style>
