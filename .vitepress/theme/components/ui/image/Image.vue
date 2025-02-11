<script setup lang="ts">
import { withBase } from 'vitepress'
import mediumZoom, { type ZoomOptions } from 'medium-zoom'
import {
  onMounted,
  onUnmounted,
  ref,
  computed,
  useTemplateRef,
  watch,
  useAttrs,
} from 'vue'
import { cn } from '@/lib/utils'
import type { DefaultTheme } from 'vitepress/theme-without-fonts'

interface Props {
  image?: DefaultTheme.ThemeableImage
  alt?: string
  zoom?: ZoomOptions | false
  class?: string
}

const { zoom: zoomConfig = { background: 'transparent' }, image } =
  defineProps<Props>()

defineOptions({ inheritAttrs: false })

const img = useTemplateRef('img')
const loadFail = ref(false)
const attrs = useAttrs()
// 计算 `imgSrc`，动态监听 `image` 变化
const imgSrc = computed(() =>
  withBase(
    (typeof image === 'string' ? image : image?.src) ||
      attrs?.src ||
      'https://assets.yuanshen.site/images/noImage.png',
  ),
)

// medium-zoom 只创建一次，避免重复初始化
const zoom = zoomConfig === false ? null : mediumZoom(zoomConfig)

const initZoom = () => {
  if (!zoom || !img.value) return
  zoom.attach(img.value)
}

onMounted(initZoom)
onUnmounted(() => zoom?.detach())

// 监听 zoomConfig 的变化，避免 Vue 的 shallow 监听失效
watch(
  () => JSON.stringify(zoomConfig),
  () => zoom?.update(zoomConfig || {}),
)

const handleLoadError = () => {
  loadFail.value = true
}
</script>

<template>
  <img
    v-if="!loadFail"
    ref="img"
    v-bind="typeof image === 'string' ? $attrs : { ...image, ...$attrs }"
    :src="imgSrc"
    :alt="alt ?? (typeof image === 'string' ? '' : image?.alt || '')"
    :class="cn('VPImage', $props.class)"
    @error="handleLoadError"
  />
  <template v-else>
    <img
      :class="cn('VPImage bg-[var(--vp-c-bg-alt)]', $props.class)"
      :alt="alt ?? (typeof image === 'string' ? '' : image?.alt || '')"
      v-bind="typeof image === 'string' ? $attrs : { ...image, ...$attrs }"
      src="https://assets.yuanshen.site/images/noImage.png"
    />
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
