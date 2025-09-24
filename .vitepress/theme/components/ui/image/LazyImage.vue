<script setup lang="ts">
import type { ImgHTMLAttributes } from 'vue'
import { autoSizes as _autoSizes, lazyLoad, loadImage } from 'unlazy'
import { nextTick, onBeforeUnmount, ref, watchEffect } from 'vue'

const props = defineProps<{
  /** Image source URL to be lazy-loaded. */
  src?: ImgHTMLAttributes['src']
  /** Image source set to be lazy-loaded. */
  srcSet?: ImgHTMLAttributes['srcset']
  /**
   * A flag to indicate whether the sizes attribute should be automatically calculated.
   * @default false
   */
  autoSizes?: boolean
  /** A BlurHash string representing the blurry placeholder image. */
  blurhash?: string
  /** A ThumbHash string representing the blurry placeholder image. */
  thumbhash?: string
  /** Optional image source URL for a custom placeholder image. Will be ignored if a BlurHash or ThumbHash is provided. */
  placeholderSrc?: string
  /** The size of the longer edge (width or height) of the BlurHash image to be decoded, depending on the aspect ratio. This option only applies when the `blurhash` prop is used. */
  placeholderSize?: number
  /**
   * A flag to indicate whether the image should be preloaded, even if it is not in the viewport yet.
   * @default false
   */
  preload?: boolean
}>()

const emit = defineEmits<{
  (event: 'load-start'): void
  (event: 'loaded', image: HTMLImageElement): void
  (event: 'error', error: Event): void
}>()

const target = ref<HTMLImageElement | undefined>()
let cleanup: (() => void) | undefined

function handleImageLoadStart() {
  emit('load-start')
}

function handleImageLoaded(image: HTMLImageElement) {
  emit('loaded', image)
}

function handleImageError(error: Event) {
  emit('error', error)
}

watchEffect(async () => {
  cleanup?.()

  if (!target.value)
    return

  // Validate that we have a valid src before setting up lazy loading
  if (!props.src && !props.srcSet) {
    // eslint-disable-next-line no-console
    console.warn('[LazyImage] Missing src or srcSet prop', { src: props.src, srcSet: props.srcSet })
    return
  }

  // Wait for DOM to update with data attributes
  await nextTick()

  // Emit load start event when lazy loading begins
  handleImageLoadStart()

  if (props.preload) {
    if (props.autoSizes) {
      _autoSizes(target.value)
    }

    loadImage(target.value, {
      onImageLoad: handleImageLoaded,
      onImageError: handleImageError,
    })
    return
  }

  cleanup = lazyLoad(target.value, {
    hash: props.thumbhash || props.blurhash,
    hashType: props.thumbhash ? 'thumbhash' : 'blurhash',
    placeholderSize: props.placeholderSize,
    onImageLoad: handleImageLoaded,
    onImageError: handleImageError,
  })
})

onBeforeUnmount(() => {
  cleanup?.()
})
</script>

<template>
  <img
    ref="target"
    :src="placeholderSrc"
    v-bind="{
      ...(src && { 'data-src': src }),
      ...(srcSet && { 'data-srcset': srcSet }),
      ...(autoSizes && { 'data-sizes': 'auto' }),
    }"
    loading="lazy"
    @error="handleImageError"
  >
</template>
