<script setup lang="ts">
import type { ZoomOptions } from 'medium-zoom'
import type { DefaultTheme } from 'vitepress/theme-without-fonts'
import { cn } from '@/lib/utils'
import { useToggle } from '@vueuse/core'
import mediumZoom from 'medium-zoom'
import { withBase } from 'vitepress'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  useAttrs,
  useId,
  watch,
} from 'vue'
import LazyImage from './LazyImage.vue'

interface Props {
  image?: DefaultTheme.ThemeableImage
  alt?: string
  zoom?: ZoomOptions | false
  class?: string
  preload?: boolean
  thumbHash?: string
  width?: number
  height?: number
  autoSizes?: boolean
  placeholderSrc?: string
}

defineOptions({ inheritAttrs: false })

// eslint-disable-next-line vue/require-valid-default-prop
const { zoom: zoomConfig = { background: 'transparent' }, width = -1, height = -1, image, preload = false, thumbHash, autoSizes = true }
  = defineProps<Props>()

const [isLoaded, toggleLoaded] = useToggle(false)
const [isLoadFail, toggleLoadFail] = useToggle(false)

const attrs = useAttrs()
const imgId = useId()

const imgSrc = computed((): string =>
  (typeof image === 'string' ? image : image?.src)
  || attrs.src!.toString().startsWith(withBase('/'))
    ? attrs.src as string
    : withBase(attrs.src as string)
      || 'https://assets.yuanshen.site/images/noImage.png',
)

const zoom = zoomConfig === false ? null : import.meta.env.SSR ? null : mediumZoom(zoomConfig)

async function initZoom() {
  if (import.meta.env.SSR)
    return

  await nextTick()

  const target = document.getElementById(imgId) as HTMLImageElement | undefined
  if (!target)
    return
  zoom?.attach(target)
}

async function handleLoaded() {
  toggleLoaded()
  initZoom()
}

onMounted(() => initZoom())
onUnmounted(() => zoom?.detach())

watch(
  () => JSON.stringify(zoomConfig),
  () => zoom?.update(zoomConfig || {}),
)
</script>

<template>
  <Transition v-if="!isLoaded && (thumbHash || placeholderSrc)" leave-active-class="animate-fade-out animate-duration-750 animate-ease-in-out">
    <LazyImage
      :src-set="imgSrc"
      :auto-sizes="autoSizes"
      :thumbhash="thumbHash"
      :preload="preload"
      :width="width"
      :height="height"
      :placeholder-src="placeholderSrc"
      :style="{
        aspectRatio: `${width} / ${height}`,
      }"
      :class="cn('VPImage', $props.class)"
      @loaded="handleLoaded"
      @error="$event => toggleLoadFail()"
    />
  </Transition>
  <img
    v-else-if="!isLoadFail"
    v-bind="typeof image === 'string' ? $attrs : { ...image, ...$attrs }"
    :id="imgId"
    :src="imgSrc"
    :alt="alt ?? (typeof image === 'string' ? '' : image?.alt || '')"
    :class="cn('VPImage', $props.class)"
    :width="width"
    :height="height"
    :style="{
      aspectRatio: `${width} / ${height}`,
    }"
    @error="$event => toggleLoadFail()"
  >
  <img
    v-else
    v-bind="typeof image === 'string' ? $attrs : { ...image, ...$attrs }"
    :class="cn('VPImage bg-[var(--vp-c-bg-alt)]', $props.class)"
    :alt="alt ?? (typeof image === 'string' ? '' : image?.alt || '')"
    src="https://assets.yuanshen.site/images/noImage.png"
  >
</template>

<style scoped>
html:not(.dark) .VPImage.dark {
  display: none;
}
.dark .VPImage.light {
  display: none;
}
</style>
