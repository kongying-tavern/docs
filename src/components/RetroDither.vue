<script setup lang="ts">
import type { RetroDitherOptions } from '~/utils/retroDither'
import { ref, useTemplateRef, watch } from 'vue'
import { retroDither } from '~/utils/retroDither'

// Image-only, static dithering. Supply a height or aspect-ratio on the host.
const props = withDefaults(defineProps<RetroDitherOptions & {
  src: string
  alt?: string
  pixelSize?: number
  fit?: 'cover' | 'contain'
  position?: string
}>(), {
  alt: '',
  pixelSize: 3,
  fit: 'cover',
  position: 'center',
})
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const rendered = ref(false)

watch(() => [canvas.value, props.src, props.fit, props.pixelSize, props.levels, props.contrast, props.brightness, props.colorize], (_, __, onCleanup) => {
  rendered.value = false
  const target = canvas.value
  if (!target)
    return
  let disposed = false
  const source = new Image()
  source.crossOrigin = 'anonymous'
  const draw = () => {
    if (disposed || !source.naturalWidth)
      return
    const { width, height } = target.getBoundingClientRect()
    if (!width || !height)
      return
    // Bound work for large images; placeholders do not need full-resolution pixels.
    const size = Math.max(1, props.pixelSize, width / 512, height / 512)
    const scale = (props.fit === 'contain' ? Math.min : Math.max)(width / source.naturalWidth, height / source.naturalHeight)
    const pixelWidth = Math.max(1, Math.round(source.naturalWidth * scale / size))
    const pixelHeight = Math.max(1, Math.round(source.naturalHeight * scale / size))
    // Bound extreme source aspect ratios as well.
    const bound = Math.min(1, 1024 / Math.max(pixelWidth, pixelHeight))
    target.width = Math.max(1, Math.round(pixelWidth * bound))
    target.height = Math.max(1, Math.round(pixelHeight * bound))
    try {
      const context = target.getContext('2d', { willReadFrequently: true })
      if (!context)
        return
      context.drawImage(source, 0, 0, target.width, target.height)
      const pixels = context.getImageData(0, 0, target.width, target.height)
      retroDither(pixels.data, target.width, props)
      context.putImageData(pixels, 0, 0)
      rendered.value = true
    }
    catch {
      // Keep the source visible if canvas is unavailable or CORS denies pixel access.
      rendered.value = false
    }
  }
  const observer = new ResizeObserver(draw)
  observer.observe(target)
  source.onload = draw
  source.src = props.src
  onCleanup(() => {
    disposed = true
    observer.disconnect()
    source.onload = null
    source.removeAttribute('src')
  })
}, { flush: 'post', immediate: true })
</script>

<template>
  <span class="retro-dither" :role="alt ? 'img' : undefined" :aria-label="alt || undefined">
    <img v-show="!rendered" :src="src" alt="" aria-hidden="true" :style="{ objectFit: fit, objectPosition: position }">
    <canvas ref="canvas" :style="{ visibility: rendered ? 'visible' : 'hidden', objectFit: fit, objectPosition: position }" aria-hidden="true" />
  </span>
</template>

<style scoped>
.retro-dither {
  display: block;
  position: relative;
  overflow: hidden;
}
.retro-dither > img,
.retro-dither > canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.retro-dither > canvas {
  image-rendering: pixelated;
}
</style>
