<script setup lang="ts">
import type { ImageItem } from './ForumImage.vue'
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { ASSET_ORIGIN } from '~/constants/site'
import { useForumImageLoading } from '~/forum/composables/view/useForumImageLoading'
import { forumImagePlaceholder } from '~/forum/services/forumImagePlaceholder'

const props = defineProps<{
  image: ImageItem
  fillContainer?: boolean
  interactive?: boolean
  class?: string
}>()
const emit = defineEmits<{
  error: []
  ready: []
  dimensions: [size: { width: number, height: number }]
}>()
const root = useTemplateRef<HTMLElement>('root')
const imageElement = useTemplateRef<HTMLImageElement>('imageElement')
const { near, visible, allowed, complete } = useForumImageLoading(root, () => props.image.src)
const ready = ref(false)
const hasError = ref(false)
const ERROR_IMAGE = `${ASSET_ORIGIN}/images/noImage.png`
const hash = computed(() => props.image.thumbHash || props.image.thumbhash)
const placeholder = computed(() => near.value && hash.value ? forumImagePlaceholder(hash.value) : undefined)
const imageClass = computed(() => props.fillContainer ? 'object-cover' : 'object-contain')
const aspectStyle = computed(() => props.fillContainer || !props.image.width || !props.image.height
  ? {}
  : { aspectRatio: `${props.image.width} / ${props.image.height}` })
const source = computed(() => hasError.value ? ERROR_IMAGE : allowed.value || ready.value ? props.image.src : undefined)
let generation = 0

watch(() => props.image.src, () => {
  generation++
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
  if (!image || !allowed.value || hasError.value || ready.value || !image.naturalWidth)
    return
  const current = generation
  // Decode the displayed image once; preserve a loaded image if decode() rejects.
  await image.decode().catch(() => {})
  if (current !== generation || hasError.value)
    return
  emit('dimensions', { width: image.naturalWidth, height: image.naturalHeight })
  ready.value = true
  complete()
  emit('ready')
}
function onError(): void {
  if (!source.value || hasError.value)
    return
  hasError.value = true
  complete()
  emit('error')
}
</script>

<template>
  <div ref="root" class="size-full relative overflow-hidden" :style="aspectStyle" :class="[hasError || interactive === false ? 'cursor-default' : hash && !ready ? 'cursor-wait' : 'cursor-zoom-in', props.class]">
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
      :style="{ opacity: placeholder && !ready && !hasError ? 0 : 1 }"
      loading="eager"
      decoding="async"
      :fetchpriority="visible ? 'high' : 'low'"
      @load="onLoad"
      @error="onError"
    >
  </div>
</template>

<style scoped>
.forum-image-source {
  transition:
    opacity 120ms ease,
    transform 200ms ease;
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
