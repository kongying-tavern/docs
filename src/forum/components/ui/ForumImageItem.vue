<script setup lang="ts">
import type { ImageItem } from './ForumImage.vue'
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ASSET_ORIGIN } from '~/constants/site'
import { useForumImageLoading } from '~/forum/composables/view/useForumImageLoading'
import { isForumLongImage } from '~/forum/services/forumImageLayout'
import { forumImagePlaceholder } from '~/forum/services/forumImagePlaceholder'
import ForumImageContextMenu from './ForumImageContextMenu.vue'

const props = defineProps<{
  image: ImageItem
  preview?: () => void
  fillContainer?: boolean
  interactive?: boolean
  class?: string
}>()
const emit = defineEmits<{
  error: []
  ready: []
  dimensions: [size: { width: number, height: number }]
}>()
const menuCommands = [{ id: 'imageOpen' as const, run: () => props.preview?.(), enabled: () => !!props.preview }]
const root = useTemplateRef<HTMLElement>('root')
const menuActive = computed(() => !!root.value)
function acceptsShortcut(event: KeyboardEvent) {
  return menuActive.value && !!root.value && (root.value.contains(event.target as Node) || root.value.closest('button') === event.target) && !document.querySelector('.forum-preview-root, [role="menu"][data-state="open"]') && event.target instanceof Element && !event.target.closest('input, textarea, [contenteditable]')
}
const imageElement = useTemplateRef<HTMLImageElement>('imageElement')
const { visible, allowed, complete } = useForumImageLoading(root, () => props.image.src)
const ready = ref(false)
const { t } = useI18n({ useScope: 'global' })
const naturalSize = ref<{ width: number, height: number }>()
const isLong = computed(() => isForumLongImage(naturalSize.value ?? props.image))
const hasError = ref(false)
const ERROR_IMAGE = `${ASSET_ORIGIN}/images/noImage.png`
const hash = computed(() => props.image.thumbHash || props.image.thumbhash)
const placeholder = computed(() => hash.value ? forumImagePlaceholder(hash.value) : undefined)
const imageClass = computed(() => isLong.value ? 'object-cover object-top' : props.fillContainer ? 'object-cover' : 'object-contain')
const aspectStyle = computed(() => props.fillContainer || isLong.value || !props.image.width || !props.image.height
  ? {}
  : { aspectRatio: `${props.image.width} / ${props.image.height}` })
const source = computed(() => hasError.value ? ERROR_IMAGE : allowed.value || ready.value ? props.image.src : undefined)
let generation = 0

watch(() => props.image.src, () => {
  generation++
  naturalSize.value = undefined
  ready.value = hasError.value = false
}, { flush: 'sync' })
watch(allowed, (value) => {
  if (!value && !ready.value)
    generation++
  if (value && (ready.value || hasError.value))
    complete()
}, { flush: 'sync' })
onBeforeUnmount(() => {
  generation++
  // Removing a DOM node alone does not consistently cancel its pending image request.
  imageElement.value?.removeAttribute('src')
})

async function onLoad(): Promise<void> {
  const image = imageElement.value
  if (!image || ready.value || !image.naturalWidth)
    return
  if (hasError.value) {
    ready.value = image.currentSrc === ERROR_IMAGE
    return
  }
  if (!allowed.value)
    return
  const current = generation
  // Decode the displayed image once; preserve a loaded image if decode() rejects.
  await image.decode().catch(() => {})
  if (current !== generation || hasError.value)
    return
  naturalSize.value = { width: image.naturalWidth, height: image.naturalHeight }
  emit('dimensions', naturalSize.value)
  ready.value = true
  complete()
  emit('ready')
}
function onError(): void {
  if (!source.value || hasError.value)
    return
  hasError.value = true
  ready.value = false
  complete()
  emit('error')
}
</script>

<template>
  <ForumImageContextMenu :image="{ ...image, naturalWidth: naturalSize?.width, naturalHeight: naturalSize?.height }" :commands="menuCommands" :active="menuActive" :accepts="acceptsShortcut">
    <div
      ref="root"
      :role="!ready && image.alt ? 'img' : undefined"
      :aria-label="!ready ? image.alt || undefined : undefined"
      class="size-full relative overflow-hidden"
      :style="[aspectStyle, ready ? undefined : { backgroundColor: 'var(--vp-c-bg-soft)' }]"
      :class="[hasError || interactive === false ? 'cursor-default' : hash && !ready ? 'cursor-wait' : 'cursor-zoom-in', props.class]"
    >
      <img
        v-if="placeholder && !ready && !hasError"
        :src="placeholder"
        alt=""
        aria-hidden="true"
        class="size-full inset-0 absolute"
        :class="imageClass"
      >
      <img
        ref="imageElement"
        :src="source"
        :alt="image.alt || ''"
        :width="image.width"
        :height="image.height"
        class="forum-image-source size-full block"
        :class="imageClass"
        :style="{ visibility: ready ? 'visible' : 'hidden' }"
        loading="eager"
        decoding="async"
        :fetchpriority="visible ? 'high' : 'low'"
        @load="onLoad"
        @error="onError"
      >
      <span v-if="isLong && !hasError" class="forum-long-image-label">
        {{ t('forum.imagePreview.longImage') }}
      </span>
    </div>
  </ForumImageContextMenu>
</template>

<style scoped>
.forum-long-image-label {
  position: absolute;
  bottom: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--forum-media-overlay);
  color: var(--forum-media-on-overlay);
  font-size: 12px;
  pointer-events: none;
}
.forum-image-source {
  transition: transform 200ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .cursor-zoom-in:hover .forum-image-source {
    transform: scale(1.05);
  }
}
html[data-reduced-motion='true'] .forum-image-source {
  transition: none;
}
</style>
