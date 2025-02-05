<script setup lang="ts">
import { withBase } from 'vitepress'
import mediumZoom, { type Zoom, type ZoomOptions } from 'medium-zoom'

import type { DefaultTheme } from 'vitepress/theme-without-fonts'
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

interface Props {
  image?: DefaultTheme.ThemeableImage
  alt?: string
  zoom?: ZoomOptions | false
}

const {
  zoom: zoomConfig = {
    background: 'transparent',
  },
} = defineProps<Props>()

defineOptions({ inheritAttrs: false })

const img = useTemplateRef('img')

const initZoom = () => {
  if (zoomConfig === false) return
  let zoom: Zoom | null = null

  const getZoom = () => (zoom === null ? mediumZoom(zoomConfig) : zoom)

  onMounted(() => {
    if (!img.value) return

    getZoom().attach(img.value)

    watch(
      () => zoomConfig,
      (options) => {
        const zoom = getZoom()
        zoom.update(zoomConfig || {})
      },
    )
  })

  onUnmounted(() => {
    if (img.value) getZoom().detach()
  })
}

initZoom()
</script>

<template>
  <template v-if="image">
    <img
      v-if="typeof image === 'string' || 'src' in image"
      ref="img"
      class="VPImage"
      v-bind="typeof image === 'string' ? $attrs : { ...image, ...$attrs }"
      :src="withBase(typeof image === 'string' ? image : image.src)"
      :alt="alt ?? (typeof image === 'string' ? '' : image.alt || '')"
    />
    <template v-else>
      <Image
        class="dark"
        :image="image.dark"
        :alt="image.alt"
        v-bind="$attrs"
      />
      <Image
        class="light"
        :image="image.light"
        :alt="image.alt"
        v-bind="$attrs"
      />
    </template>
  </template>
  <template v-else>
    <img ref="img" class="VPImage" v-bind="$attrs" />
  </template>
</template>

<style scoped>
html:not(.dark) .VPImage.dark {
  display: none;
}

.dark .VPImage.light {
  display: none;
}
</style>
