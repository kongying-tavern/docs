<script setup lang="ts">
import type { Zoom, ZoomOptions, ZoomSelector } from 'medium-zoom'
import mediumZoom from 'medium-zoom'
import { useRouter } from 'vitepress'

import { nextTick, onBeforeUnmount, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    selector?: ZoomSelector
    options?: ZoomOptions
  }>(),
  {
    selector: '.vp-doc img',
    options: () => ({}),
  },
)

let zoom: Zoom | undefined
let timeoutId: ReturnType<typeof setTimeout> | undefined

const router = useRouter()
router.onAfterRouteChange = setupMediumZoom

onMounted(setupMediumZoom)
onBeforeUnmount(() => {
  clearTimeout(timeoutId)
  if (zoom) {
    zoom.detach()
    zoom.close()
  }
})

function setupMediumZoom() {
  nextTick(() => {
    if (zoom) {
      zoom.detach()
      zoom.close()
      zoom = undefined
    }
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      zoom = mediumZoom(props.selector, {
        background: 'var(--vp-c-bg)',
        ...props.options,
      })
    }, 100)
  })
}
</script>

<template>
  <div />
</template>

<style>
.medium-zoom-overlay {
  backdrop-filter: blur(5rem);
}

.medium-zoom-overlay,
.medium-zoom-image--opened {
  object-fit: contain !important;
  border-radius: 0 !important;
  border: none !important;
  z-index: 999;
}
</style>
