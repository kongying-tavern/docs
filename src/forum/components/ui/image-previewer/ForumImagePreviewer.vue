<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import type { ForumImageCommand } from '~/forum/composables/view/useForumImageMenu'
import type { ForumImageResource } from '~/forum/services/forumImageResource'
import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import { DialogContent, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { FeyCards } from '@/components/ui/cards'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { useForumShortcutPreferences } from '~/forum/composables/state/useForumShortcutPreferences'
import { isForumLongImage } from '~/forum/services/forumImageLayout'
import ForumImageContextMenu from '../ForumImageContextMenu.vue'
import ForumImageNavigationButton from '../ForumImageNavigationButton.vue'
import PreviewerControls from './components/PreviewerControls.vue'
import PreviewerLongImage from './components/PreviewerLongImage.vue'
import PreviewerSidePanel from './components/PreviewerSidePanel.vue'
import { useActivePreviewer } from './composables/useActivePreviewer'
import { stackTransform, usePreviewerFlip } from './composables/usePreviewerFlip'
import { usePreviewerTransform } from './composables/usePreviewerTransform'

export type PreviewImage = ForumImageResource

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

const { options = {}, images, context } = defineProps<{
  images: PreviewImage[]
  options?: PreviewerOptions
  context?: PreviewerContext
}>()

const emit = defineEmits<{
  open: [index: number]
  close: []
  change: [index: number]
}>()
defineSlots<{
  default: (props: { openAt: typeof openAt, close: typeof close }) => unknown
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
const longReader = useTemplateRef<InstanceType<typeof PreviewerLongImage>>('longReader')
const imageEl = useTemplateRef<HTMLImageElement>('imageEl')
const panelOpen = ref(false)
const panelCollapsed = useLocalStorage('forum-image-preview-panel-collapsed', false)
const panelEntering = ref(false)
const slideDir = ref<1 | -1 | 0>(0)
const prevImg = ref<{ src: string, alt?: string } | null>(null)
const prevSeq = ref(0)
const carriedRef = ref(0)
let prevClearTimer: number | undefined
let closeTimer: number | undefined

/** 委托替换的图片列表（如预览打开后点击侧边面板中的评论图片）；置空则跟随 props */
const imagesOverride = ref<PreviewImage[] | null>(null)
const displayImages = computed(() => imagesOverride.value ?? images)

const total = computed(() => displayImages.value.length)
const imageAriaLabels = computed(() => displayImages.value.map((_, index) =>
  message.value.forum.imagePreview.showImage.replace('{index}', String(index + 1))))
const zoomEnabled = computed(() => options.zoom !== false)
const maxZoom = computed(() => options.maxZoom ?? 4)
const hasPanel = computed(() =>
  isDesktop.value && visible.value && Boolean(context) && !panelCollapsed.value)

const imgReady = ref(false)
const loadedSize = ref<{ width: number, height: number }>()
const activeImage = computed(() => ({ ...displayImages.value[current.value], ...loadedSize.value }))
const isLongImage = computed(() => isForumLongImage(activeImage.value))
const imgStyle = computed(() => {
  const image = displayImages.value[current.value]
  return image?.width && image?.height
    ? { aspectRatio: `${image.width} / ${image.height}` }
    : undefined
})

const enterDur = computed(() => Math.round(240 - Math.min(Math.abs(carriedRef.value), 130) * 0.4))
const exitDur = computed(() => enterDur.value)

/** 缓存命中时 load 事件可能已错过，需主动探测 */
function syncImgReady(): void {
  const img = imageEl.value
  imgReady.value = Boolean(img?.complete && img.naturalWidth > 0)
  if (imgReady.value && img)
    loadedSize.value = { width: img.naturalWidth, height: img.naturalHeight }
}

watch([current, () => displayImages.value[current.value]?.src], () => {
  loadedSize.value = undefined
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
  ignoreClick,
  touchInput,
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
  swipeEnabled: computed(() => total.value > 1),
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
}

function commitSlide(target: number, dir: 1 | -1, options: SlideChangeOptions = {}): void {
  clearSource()
  const old = displayImages.value[current.value]
  current.value = target
  slideDir.value = dir
  carriedRef.value = options.carried ?? 0
  prevImg.value = old ? { src: old.src, alt: old.alt } : null
  prevSeq.value += 1
  resetTransform()
  preloadNeighbors()
  emit('change', target)
  clearTimeout(prevClearTimer)
  prevClearTimer = window.setTimeout(() => {
    prevImg.value = null
  }, 300)
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
  commitSlide(target, dir, options)
}

/** 委托替换整份图片列表（活跃预览内容变化），保留预览与面板打开状态 */
function setImages(images: PreviewImage[], index: number): void {
  const count = images.length
  if (count === 0)
    return
  clearSource()
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
  if (tryDelegate(index, images))
    return
  if (!images[index])
    return
  clearTimeout(closeTimer)
  setSource(isForumLongImage(images[index]) ? undefined : sourceEl)
  clickState = null
  lastClickAt = 0
  imagesOverride.value = null
  current.value = Math.min(Math.max(index, 0), total.value - 1)
  loadedSize.value = undefined
  if (!visible.value) {
    prevActive = document.activeElement as HTMLElement | null
    prevOverflow = document.documentElement.style.overflow
  }
  visible.value = true
  closing.value = false
  panelOpen.value = true
  panelEntering.value = isDesktop.value && Boolean(context) && !panelCollapsed.value
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
  if (ignoreClick.value)
    return
  const target = event.target as HTMLElement | null
  if (target === containerEl.value || target === stageEl.value)
    close()
}

/** 控件点击不应进入图片拖拽手势；其余指针仍由根节点接管，允许拖出图片后继续。 */
function handlePreviewPointerDown(event: PointerEvent): void {
  if (entering.value || closing.value)
    return
  if ((event.target as Element | null)?.closest('button, .preview-side-panel, .forum-preview-cards'))
    return
  // A new gesture takes over from the previous slide immediately.
  imageEl.value?.getAnimations().forEach((animation) => {
    if (animation instanceof CSSAnimation && animation.animationName.startsWith('preview-slide-'))
      animation.finish()
  })
  prevImg.value = null
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
  if (entering.value || closing.value || !zoomEnabled.value || ignoreClick.value || touchInput.value)
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

const shortcutPreferences = useForumShortcutPreferences()
const previewActive = computed(() => visible.value && !closing.value)
const shortcut = shortcutPreferences.label

function acceptsImageShortcut(event: KeyboardEvent, id?: string): boolean {
  const target = event.target instanceof Element ? event.target : null
  if ((event.key === 'Enter' || event.key === ' ') && target?.closest('button, a[href], [role="button"]'))
    return false
  if (document.querySelector('[role="menu"][data-state="open"], [data-image-metadata]'))
    return false
  if (target?.closest('[data-slot="popover-content"]'))
    return false
  if (id !== 'imageClose' && id !== 'imagePanel' && target?.closest('.preview-side-panel, .forum-long-reader-map'))
    return false
  return !target?.closest('[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]')
    || !!target?.closest('.forum-preview-root')
}
function changeImageZoom(value: number) {
  if (isLongImage.value)
    return longReader.value?.changeZoom(value)
  const rect = imageEl.value?.getBoundingClientRect()
  if (rect)
    smoothZoom(() => zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, value / scale.value))
}
const previewCommands: ForumImageCommand[] = [
  { id: 'imageToggleZoom', run: () => changeImageZoom((isLongImage.value ? longReader.value?.zoom ?? 1 : scale.value) > 1 ? 1 : 2), enabled: () => zoomEnabled.value },
  { id: 'imagePrevious', run: () => goTo(current.value - 1, -1), enabled: () => total.value > 1 },
  { id: 'imageNext', run: () => goTo(current.value + 1, 1), enabled: () => total.value > 1 },
  { id: 'imageZoomIn', run: () => changeImageZoom((isLongImage.value ? longReader.value?.zoom ?? 1 : scale.value) * 1.5), enabled: () => zoomEnabled.value },
  { id: 'imageZoomOut', run: () => changeImageZoom((isLongImage.value ? longReader.value?.zoom ?? 1 : scale.value) / 1.5), enabled: () => zoomEnabled.value },
  { id: 'imageReset', run: () => isLongImage.value ? longReader.value?.changeZoom(1) : resetTransform(), enabled: () => zoomEnabled.value },
  { id: 'imageTop', run: () => longReader.value?.scrollToEdge(false), enabled: isLongImage },
  { id: 'imageBottom', run: () => longReader.value?.scrollToEdge(true), enabled: isLongImage },
  { id: 'imagePanel', run: () => panelCollapsed.value = !panelCollapsed.value, enabled: () => isDesktop.value && !!context },
  { id: 'imageClose', run: close },
]

watch(() => images, () => {
  if (current.value >= total.value)
    current.value = Math.max(total.value - 1, 0)
})

onBeforeUnmount(() => {
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
      <DialogRoot v-if="visible" :open="true" @update:open="!$event && close()">
        <DialogContent as-child :aria-describedby="undefined" @close-auto-focus.prevent @escape-key-down="shortcutPreferences.desktopUi.value && $event.preventDefault()">
          <div
            ref="containerEl"
            class="forum-preview-root inset-0 fixed z-[1000]"
            :class="{ closing, entering, 'is-long-image': isLongImage, 'has-image-dots': total > 1 && options.dots !== false, 'source-transition': usesSourceTransition, 'has-panel': hasPanel, 'panel-entering': hasPanel && panelEntering, 'is-dragging': dragging, 'is-settling': settling }"
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

            <ForumImageContextMenu :image="{ ...displayImages[current], naturalWidth: loadedSize?.width, naturalHeight: loadedSize?.height }" :commands="previewCommands" :active="previewActive" :accepts="acceptsImageShortcut">
              <div
                ref="stageEl"
                class="forum-preview-stage"
                :class="{ 'is-long-image': isLongImage }"
              >
                <PreviewerLongImage v-if="isLongImage" ref="longReader" :key="`${current}:${activeImage.src}`" :image="activeImage" :zoom-enabled="zoomEnabled" :max-zoom="maxZoom" @dimensions="loadedSize = $event" />
                <div
                  v-else
                  ref="stackEl"
                  class="forum-preview-stack"
                  :class="{
                    flipping,
                    settling,
                    'is-idle': scale === 1 && !dragging && !settling && !entering && !closing && !flipping,
                    'can-zoom-in': zoomEnabled && scale === 1,
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
                    @load="syncImgReady"
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
            </ForumImageContextMenu>

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
              :close-shortcut="shortcut('imageClose')"
              :close-shortcut-aria="shortcutPreferences.aria('imageClose')"
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
              :title="shortcut('imagePanel')"
              :aria-keyshortcuts="shortcutPreferences.aria('imagePanel')"
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
