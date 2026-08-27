<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useMediaQuery } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FeyCards } from '@/components/ui/cards'
import { useLocalized } from '@/hooks/useLocalized'
import PreviewerControls from './components/PreviewerControls.vue'
import PreviewerSidePanel from './components/PreviewerSidePanel.vue'
import { useActivePreviewer } from './composables/useActivePreviewer'
import { usePreviewerFlip } from './composables/usePreviewerFlip'
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
const containerEl = ref<HTMLDivElement>()
const stageEl = ref<HTMLDivElement>()
const stackEl = ref<HTMLDivElement>()
const imageEl = ref<HTMLImageElement>()
const panelOpen = ref(false)
const panelCollapsed = ref(false)
const slideDir = ref<1 | -1 | 0>(0)
const prevImg = ref<{ src: string, alt?: string } | null>(null)
const prevSeq = ref(0)
let prevClearTimer: number | undefined
let closeTimer: number | undefined

const total = computed(() => props.images.length)
const imageAriaLabels = computed(() => props.images.map((_, index) =>
  message.value.forum.imagePreview.showImage.replace('{index}', String(index + 1))))
const zoomEnabled = computed(() => props.options.zoom !== false)
const maxZoom = computed(() => props.options.maxZoom ?? 4)
const hasPanel = computed(() =>
  isDesktop.value && visible.value && Boolean(props.context) && !panelCollapsed.value)

const {
  scale,
  tx,
  ty,
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
  onSwipe: direction => goTo(current.value + direction, direction),
  onVerticalClose: () => close(),
})

let prevActive: HTMLElement | null = null
let prevOverflow = ''
let clickState: { s: number, x: number, y: number } | null = null
let lastClickAt = 0
let smoothZoomTimer: number | undefined
const {
  flipping,
  usesSourceTransition,
  setSource,
  beginEnter,
  beginExit,
  clearSource,
} = usePreviewerFlip(imageEl, stackEl)

function goTo(index: number, direction?: 1 | -1): void {
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
  const old = props.images[current.value]
  current.value = target
  slideDir.value = dir
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
  if (slideDir.value === 0)
    return usesSourceTransition.value ? '' : 'enter-scale'
  return slideDir.value === 1 ? 'enter-right' : 'enter-left'
})

const self: { getImages: () => PreviewImage[], goTo: (index: number) => void, isOpen: () => boolean } = {
  getImages: () => props.images,
  goTo,
  isOpen: () => visible.value && !closing.value,
}

function preloadNeighbors(): void {
  const count = total.value
  if (count < 2)
    return
  for (const i of [(current.value - 1 + count) % count, (current.value + 1) % count]) {
    const img = props.images[i]
    if (img)
      new Image().src = img.src
  }
}

function openAt(index: number, sourceEl?: Element | null): void {
  if (tryDelegate(index, props.images))
    return
  if (!props.images[index])
    return
  setSource(sourceEl)
  clickState = null
  lastClickAt = 0
  current.value = Math.min(Math.max(index, 0), total.value - 1)
  visible.value = true
  closing.value = false
  panelOpen.value = true
  panelCollapsed.value = false
  slideDir.value = 0
  prevImg.value = null
  resetTransform()
  prevActive = document.activeElement as HTMLElement | null
  prevOverflow = document.documentElement.style.overflow
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
  panelOpen.value = false
  closing.value = true
  const exitDelay = beginExit()
  closeTimer = window.setTimeout(() => {
    visible.value = false
    closing.value = false
    flipping.value = false
    clearSource()
    document.documentElement.style.overflow = prevOverflow
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

/** 捕获阶段拦截按键：预览打开时 ESC/方向键只作用于预览，不冒泡给外层 Dialog */
function handleKeydown(event: KeyboardEvent): void {
  if (!visible.value || closing.value)
    return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopImmediatePropagation()
    close()
    return
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
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

onMounted(() => {
  window.addEventListener('keydown', handleKeydown, { capture: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown, { capture: true })
  if (visible.value)
    document.documentElement.style.overflow = prevOverflow
  clearTimeout(prevClearTimer)
  clearTimeout(smoothZoomTimer)
  clearTimeout(closeTimer)
  unregister(self)
})

defineExpose({ openAt, close })
</script>

<template>
  <div class="forum-image-previewer">
    <slot :open-at="openAt" :close="close" />

    <Teleport to="body">
      <div
        v-if="visible"
        ref="containerEl"
        class="forum-preview-root inset-0 fixed z-[1000]"
        :class="{ closing, 'has-panel': hasPanel, 'is-dragging': dragging }"
        role="dialog"
        aria-modal="true"
        :aria-label="message.forum.topic.previewTitle"
        @pointerdown="handlePreviewPointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @wheel="handleWheel"
        @click="handleRootClick"
      >
        <div class="forum-preview-overlay" />

        <div
          ref="stageEl"
          class="forum-preview-stage"
        >
          <div
            ref="stackEl"
            class="forum-preview-stack"
            :class="{ flipping, 'can-zoom-in': scale === 1, 'can-grab': scale > 1 && !dragging }"
            :style="{ transform: stackTransform(tx, ty, scale) }"
            @click="handleStackClick"
          >
            <img
              v-if="prevImg"
              :key="`prev-${prevSeq}`"
              :src="prevImg.src"
              :alt="prevImg.alt || ''"
              class="forum-preview-image forum-preview-exit"
              :class="slideDir === 1 ? 'exit-left' : 'exit-right'"
              draggable="false"
            >
            <img
              v-if="total > 0"
              :key="current"
              ref="imageEl"
              :src="images[current].src"
              :alt="images[current].alt || ''"
              class="forum-preview-image forum-preview-enter"
              :class="enterAnimClass"
              draggable="false"
            >
          </div>

          <button
            v-if="total > 1"
            type="button"
            class="forum-preview-nav prev"
            :aria-label="message.forum.imagePreview.previous"
            @click.stop="goTo(current - 1, -1)"
          >
            <span class="i-lucide-chevron-left" aria-hidden="true" />
          </button>
          <button
            v-if="total > 1"
            type="button"
            class="forum-preview-nav next"
            :aria-label="message.forum.imagePreview.next"
            @click.stop="goTo(current + 1, 1)"
          >
            <span class="i-lucide-chevron-right" aria-hidden="true" />
          </button>
        </div>

        <FeyCards
          v-if="options.counter !== false && total > 1"
          class="forum-preview-cards"
          :img-src="images.map(i => i.src)"
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
      </div>

      <PreviewerSidePanel
        v-if="isDesktop && visible"
        :open="panelOpen && !panelCollapsed"
        :context="context"
        @close="close"
      />
    </Teleport>
  </div>
</template>

<style scoped src="./ForumImagePreviewer.scss"></style>
