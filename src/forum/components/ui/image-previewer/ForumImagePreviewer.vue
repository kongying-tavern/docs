<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useEventListener, useLocalStorage, useMediaQuery } from '@vueuse/core'
import { DialogContent, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { FeyCards } from '@/components/ui/cards'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import ForumImageNavigationButton from '../ForumImageNavigationButton.vue'
import PreviewerControls from './components/PreviewerControls.vue'
import PreviewerSidePanel from './components/PreviewerSidePanel.vue'
import { useActivePreviewer } from './composables/useActivePreviewer'
import { stackTransform, usePreviewerFlip } from './composables/usePreviewerFlip'
import { usePreviewerTransform } from './composables/usePreviewerTransform'

export interface PreviewImage {
  src: string
  width?: number
  height?: number
  alt?: string
}

export interface PreviewerContext {
  kind: 'topic' | 'comment'
  topic?: ForumAPI.Topic
  comment?: ForumAPI.Comment
  repo?: ForumAPI.Repo
  topicAuthorId?: string | number
}

export interface PreviewerOptions {
  zoom?: boolean
  maxZoom?: number
  counter?: boolean
  dots?: boolean
}

const props = withDefaults(defineProps<{
  images: PreviewImage[]
  options?: PreviewerOptions
  context?: PreviewerContext
}>(), {
  options: () => ({}),
})

const emit = defineEmits<{
  open: [index: number]
  close: []
  change: [index: number]
}>()

const { message } = useLocalized()
const { tryDelegate, register, unregister } = useActivePreviewer()

const isDesktop = useMediaQuery('(min-width: 960px)')

const visible = ref(false)
const closing = ref(false)
const current = ref(0)
const containerEl = useTemplateRef<HTMLDivElement>('containerEl')
const stageEl = useTemplateRef<HTMLDivElement>('stageEl')
const stackEl = useTemplateRef<HTMLDivElement>('stackEl')
const imageEl = useTemplateRef<HTMLImageElement>('imageEl')
const panelOpen = ref(false)
const panelCollapsed = useLocalStorage('forum-image-preview-panel-collapsed', false)
const panelEntering = ref(false)
const slideDir = ref<1 | -1 | 0>(0)
const prevImg = ref<{ src: string, alt?: string } | null>(null)
const prevSeq = ref(0)
const carriedRef = ref(0)
const sweeping = ref(false)
const sweepDir = ref<0 | 1 | -1>(0)
let sweepTimer: number | undefined
let prevClearTimer: number | undefined
let closeTimer: number | undefined

/** 委托替换的图片列表（如预览打开后点击侧边面板中的评论图片）；置空则跟随 props */
const imagesOverride = ref<PreviewImage[] | null>(null)
const displayImages = computed(() => imagesOverride.value ?? props.images)

const total = computed(() => displayImages.value.length)
const imageAriaLabels = computed(() => displayImages.value.map((_, index) =>
  message.value.forum.imagePreview.showImage.replace('{index}', String(index + 1))))
const zoomEnabled = computed(() => props.options.zoom !== false)
const maxZoom = computed(() => props.options.maxZoom ?? 4)
const hasPanel = computed(() =>
  isDesktop.value && visible.value && Boolean(props.context) && !panelCollapsed.value)

const imgReady = ref(false)
const imgStyle = computed(() => {
  const image = displayImages.value[current.value]
  return image?.width && image?.height
    ? { aspectRatio: `${image.width} / ${image.height}` }
    : undefined
})

/** 与箭头切换同速 */
const enterDur = computed(() => Math.max(
  90,
  Math.round((130 + Math.abs(carriedRef.value)) * 420 / 130),
))
const exitDur = computed(() => Math.max(
  60,
  Math.round((130 - Math.abs(carriedRef.value)) * 300 / 130),
))

/** 缓存命中时 load 事件可能已错过，需主动探测 */
function syncImgReady(): void {
  const img = imageEl.value
  imgReady.value = Boolean(img?.complete && img.naturalWidth > 0)
}

watch([current, displayImages], () => {
  imgReady.value = false
  nextTick(syncImgReady)
})

const {
  scale,
  tx,
  ty,
  dragRotate,
  settling,
  dragging,
  zoomAt,
  setTransform,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleWheel,
  handleDoubleClick,
  reset: resetTransform,
} = usePreviewerTransform({
  maxZoom,
  imageEl,
  zoomEnabled,
  onSwipe: (direction, dx) => goTo(current.value + direction, direction, { carried: dx }),
  onVerticalClose: () => close(),
})

let prevActive: HTMLElement | null = null
let prevOverflow = ''
let clickState: { s: number, x: number, y: number } | null = null
let lastClickAt = 0
let smoothZoomTimer: number | undefined
const { reducedMotion } = useSitePreferences()
const {
  flipping,
  entering,
  usesSourceTransition,
  setSource,
  beginEnter,
  beginExit,
  clearSource,
} = usePreviewerFlip(imageEl, stackEl, reducedMotion)

interface SlideChangeOptions {
  /** 拖拽松手位移（px） */
  carried?: number
  sweep?: boolean
}

function commitSlide(target: number, dir: 1 | -1, options: SlideChangeOptions = {}): void {
  clearSource()
  const old = displayImages.value[current.value]
  current.value = target
  slideDir.value = dir
  carriedRef.value = options.sweep
    ? 0
    : Math.min(Math.max(options.carried ?? 0, -140), 140)
  prevImg.value = options.sweep || !old ? null : { src: old.src, alt: old.alt }
  prevSeq.value += 1
  resetTransform()
  emit('change', target)
  clearTimeout(prevClearTimer)
  prevClearTimer = window.setTimeout(() => {
    prevImg.value = null
  }, 300)
}

function startSweep(dir: 1 | -1): void {
  const count = total.value
  const start = current.value
  const end = dir === -1 ? 0 : count - 1
  const steps = (start - end + count) % count
  if (steps === 0)
    return
  clearTimeout(sweepTimer)
  sweeping.value = true
  sweepDir.value = dir
  let step = 0
  const tick = (): void => {
    const next = dir === -1
      ? (start - step - 1 + count) % count
      : (start + step + 1) % count
    commitSlide(next, dir, { sweep: true })
    step += 1
    if (step < steps) {
      sweepTimer = window.setTimeout(tick, 120)
    }
    else {
      sweeping.value = false
      sweepDir.value = 0
    }
  }
  sweepTimer = window.setTimeout(tick, 50)
}

function goTo(index: number, direction?: 1 | -1, options: SlideChangeOptions = {}): void {
  const count = total.value
  if (count === 0)
    return
  const target = ((index % count) + count) % count
  if (target === current.value)
    return
  let dir = direction
  if (dir === undefined) {
    const delta = (target - current.value + count) % count
    dir = delta > count / 2 ? -1 : 1
  }
  // 打断进行中的回卷扫描
  clearTimeout(sweepTimer)
  sweeping.value = false
  sweepDir.value = 0
  if ((options.carried ?? 0) !== 0) {
    const wrapBack = dir === -1 && current.value === 0 && target === count - 1
    const wrapForward = dir === 1 && current.value === count - 1 && target === 0
    if (wrapBack || wrapForward) {
      startSweep(wrapBack ? 1 : -1)
      return
    }
  }
  commitSlide(target, dir, options)
}

/** 委托替换整份图片列表（活跃预览内容变化），保留预览与面板打开状态 */
function setImages(images: PreviewImage[], index: number): void {
  const count = images.length
  if (count === 0)
    return
  clearSource()
  clearTimeout(sweepTimer)
  sweeping.value = false
  sweepDir.value = 0
  const target = Math.min(Math.max(index, 0), count - 1)
  const old = displayImages.value[current.value]
  imagesOverride.value = images
  current.value = target
  slideDir.value = 1
  carriedRef.value = 0
  prevImg.value = old ? { src: old.src, alt: old.alt } : null
  prevSeq.value += 1
  resetTransform()
  emit('change', target)
  clearTimeout(prevClearTimer)
  prevClearTimer = window.setTimeout(() => {
    prevImg.value = null
  }, 300)
}

const enterAnimClass = computed(() => {
  if (sweepDir.value !== 0)
    return sweepDir.value === 1 ? 'sweep-right' : 'sweep-left'
  if (slideDir.value === 0)
    return usesSourceTransition.value ? '' : 'enter-scale'
  return slideDir.value === 1 ? 'enter-right' : 'enter-left'
})

const self: {
  getImages: () => PreviewImage[]
  goTo: (index: number) => void
  setImages: (images: PreviewImage[], index: number) => void
  isOpen: () => boolean
} = {
  getImages: () => displayImages.value,
  goTo,
  setImages,
  isOpen: () => visible.value && !closing.value,
}

function preloadNeighbors(): void {
  const count = total.value
  if (count < 2)
    return
  for (const i of [(current.value - 1 + count) % count, (current.value + 1) % count]) {
    const img = displayImages.value[i]
    if (img)
      new Image().src = img.src
  }
}

function openAt(index: number, sourceEl?: Element | null): void {
  if (tryDelegate(index, props.images))
    return
  if (!props.images[index])
    return
  clearTimeout(closeTimer)
  setSource(sourceEl)
  clickState = null
  lastClickAt = 0
  clearTimeout(sweepTimer)
  sweeping.value = false
  sweepDir.value = 0
  imagesOverride.value = null
  current.value = Math.min(Math.max(index, 0), total.value - 1)
  if (!visible.value) {
    prevActive = document.activeElement as HTMLElement | null
    prevOverflow = document.documentElement.style.overflow
  }
  visible.value = true
  closing.value = false
  panelOpen.value = true
  panelEntering.value = isDesktop.value && Boolean(props.context) && !panelCollapsed.value
  slideDir.value = 0
  prevImg.value = null
  imgReady.value = false
  nextTick(syncImgReady)
  resetTransform()
  document.documentElement.style.overflow = 'hidden'
  preloadNeighbors()
  register(self)
  emit('open', current.value)
  beginEnter()
}

function close(): void {
  if (closing.value)
    return
  unregister(self)
  clearTimeout(sweepTimer)
  sweeping.value = false
  sweepDir.value = 0
  panelOpen.value = false
  closing.value = true
  const exitDelay = beginExit()
  closeTimer = window.setTimeout(async () => {
    visible.value = false
    closing.value = false
    flipping.value = false
    imagesOverride.value = null
    clearSource()
    document.documentElement.style.overflow = prevOverflow
    await nextTick()
    restoreFocus()
    prevActive = null
    emit('close')
  }, exitDelay)
}

function handleRootClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  if (target === containerEl.value || target === stageEl.value)
    close()
}

/** 控件点击不应进入图片拖拽手势；其余指针仍由根节点接管，允许拖出图片后继续。 */
function handlePreviewPointerDown(event: PointerEvent): void {
  if (entering.value || closing.value)
    return
  if ((event.target as Element | null)?.closest('button'))
    return
  handlePointerDown(event)
}

function smoothZoom(action: () => void): void {
  flipping.value = true
  action()
  clearTimeout(smoothZoomTimer)
  smoothZoomTimer = window.setTimeout(() => {
    flipping.value = false
  }, 380)
}

/**
 * 图片上的单击/双击：单击立即像滚轮一样在点击点放大（零延迟）；
 * 300ms 内到达的第二击视为双击，回滚单击的放缩后再执行
 * "放大态复位/未放大放大"切换。
 */
function handleStackClick(event: MouseEvent): void {
  if (entering.value || closing.value)
    return
  const now = performance.now()
  if (clickState && now - lastClickAt < 300) {
    const prev = clickState
    clickState = null
    smoothZoom(() => {
      setTransform(prev.s, prev.x, prev.y)
      handleDoubleClick(event)
    })
    return
  }
  clickState = { s: scale.value, x: tx.value, y: ty.value }
  lastClickAt = now
  smoothZoom(() => zoomAt(event.clientX, event.clientY, 2))
}

/**
 * 焦点还给打开前的元素；图片等不可聚焦元素回退到所在 dialog/sheet 内的
 * 可聚焦元素，保证外层 Dialog 的 ESC 仍可被 reka 命中。
 */
function restoreFocus(): void {
  const target = prevActive
  if (!target || !document.contains(target))
    return
  const container = target.closest('[data-slot="dialog-content"], [data-slot="sheet-content"]')
  if (container) {
    const focusable = container.querySelector(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    ;((focusable as HTMLElement | null) ?? (container as HTMLElement)).focus()
    return
  }
  target.focus?.()
}

/** 内层弹层优先处理按键；图片快捷键不干扰侧栏控件。 */
function handleKeydown(event: KeyboardEvent): void {
  if (!visible.value || closing.value || event.isComposing)
    return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('[data-slot="dropdown-menu-content"], [data-slot="dropdown-menu-sub-content"], [data-slot="popover-content"], [data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]'))
    return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopImmediatePropagation()
    close()
    return
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    if (target?.closest('.preview-side-panel, input, textarea, select, [contenteditable="true"]'))
      return
    event.preventDefault()
    event.stopImmediatePropagation()
    const dir = event.key === 'ArrowRight' ? 1 : -1
    goTo(current.value + dir, dir)
  }
}

watch(() => props.images, () => {
  if (current.value >= total.value)
    current.value = Math.max(total.value - 1, 0)
})

useEventListener('keydown', handleKeydown, { capture: true })

onBeforeUnmount(() => {
  if (visible.value)
    document.documentElement.style.overflow = prevOverflow
  clearTimeout(prevClearTimer)
  clearTimeout(smoothZoomTimer)
  clearTimeout(closeTimer)
  clearTimeout(sweepTimer)
  unregister(self)
})

defineExpose({ openAt, close })
</script>

<template>
  <div class="forum-image-previewer">
    <slot :open-at="openAt" :close="close" />

    <Teleport to="body">
      <DialogRoot v-if="visible" :open="true" @update:open="!$event && close()">
        <DialogContent as-child :aria-describedby="undefined" @close-auto-focus.prevent>
          <div
            ref="containerEl"
            class="forum-preview-root inset-0 fixed z-[1000]"
            :class="{ closing, entering, 'source-transition': usesSourceTransition, 'has-panel': hasPanel, 'panel-entering': hasPanel && panelEntering, 'is-dragging': dragging, 'is-settling': settling }"
            role="dialog"
            aria-modal="true"
            :aria-label="message.forum.topic.previewTitle"
            @pointerdown="handlePreviewPointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointercancel="handlePointerUp"
            @wheel="!entering && !closing && handleWheel($event)"
            @click="handleRootClick"
          >
            <DialogTitle class="sr-only">
              {{ message.forum.topic.previewTitle }}
            </DialogTitle>
            <div class="forum-preview-overlay" />

            <div
              ref="stageEl"
              class="forum-preview-stage"
            >
              <div
                ref="stackEl"
                class="forum-preview-stack"
                :class="{
                  flipping,
                  settling,
                  'is-idle': scale === 1 && !dragging && !settling && !sweeping && !entering && !closing && !flipping,
                  'can-zoom-in': scale === 1,
                  'can-grab': scale > 1 && !dragging,
                }"
                :style="{ transform: stackTransform(tx, ty, scale, dragRotate) }"
                @click="handleStackClick"
              >
                <img
                  v-if="prevImg"
                  :key="`prev-${prevSeq}`"
                  :src="prevImg.src"
                  :alt="prevImg.alt || ''"
                  class="forum-preview-image forum-preview-exit"
                  :class="slideDir === 1 ? 'exit-left' : 'exit-right'"
                  :style="{
                    '--preview-carry': `${carriedRef}px`,
                    '--preview-exit-dur': `${exitDur}ms`,
                  }"
                  draggable="false"
                >
                <img
                  v-if="total > 0"
                  :key="current"
                  ref="imageEl"
                  :src="displayImages[current].src"
                  :alt="displayImages[current].alt || ''"
                  class="forum-preview-image forum-preview-enter"
                  :class="[enterAnimClass, { 'is-loading': !imgReady }]"
                  :style="{
                    ...imgStyle,
                    '--preview-carry': `${carriedRef}px`,
                    '--preview-enter-dur': `${enterDur}ms`,
                  }"
                  draggable="false"
                  @load="imgReady = true"
                  @error="imgReady = true"
                >
              </div>

              <ForumImageNavigationButton
                v-if="total > 1"
                class="forum-preview-nav prev"
                auto-hide
                direction="previous"
                :label="message.forum.imagePreview.previous"
                @click.stop="goTo(current - 1, -1)"
              />
              <ForumImageNavigationButton
                v-if="total > 1"
                class="forum-preview-nav next"
                auto-hide
                direction="next"
                :label="message.forum.imagePreview.next"
                @click.stop="goTo(current + 1, 1)"
              />
            </div>

            <FeyCards
              v-if="options.counter !== false && total > 1"
              class="forum-preview-cards"
              :img-src="displayImages.map(i => i.src)"
              :aria-labels="imageAriaLabels"
              :active="current"
              :width="36"
              :height="52"
              :card-spacing="7"
              :shift-distance="10"
              @select="goTo"
            />

            <PreviewerControls
              :index="current"
              :total="total"
              :show-dots="options.dots !== false"
              @close="close"
              @select="goTo"
            />

            <button
              v-if="isDesktop && context"
              type="button"
              class="forum-preview-panel-toggle"
              :aria-label="panelCollapsed ? message.forum.imagePreview.expandPanel : message.forum.imagePreview.collapsePanel"
              @click.stop="panelCollapsed = !panelCollapsed"
            >
              <span
                :class="panelCollapsed ? 'i-lucide-chevron-left' : 'i-lucide-chevron-right'"
                aria-hidden="true"
              />
            </button>
            <PreviewerSidePanel
              v-if="isDesktop && visible"
              :open="panelOpen && !panelCollapsed"
              :context="context"
              @before-enter="panelEntering = true"
              @after-enter="panelEntering = false"
              @enter-cancelled="panelEntering = false"
            />
          </div>
        </DialogContent>
      </DialogRoot>
    </Teleport>
  </div>
</template>

<style scoped src="./ForumImagePreviewer.css"></style>
