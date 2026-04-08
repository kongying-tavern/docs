<script setup lang="ts">
import type { PhotoSwipeOptions, SlideData } from 'photoswipe'
import { onBeforeUnmount, ref } from 'vue'
import 'photoswipe/style.css'

interface Props {
  images: Array<{
    src: string
    width?: number
    height?: number
    alt?: string
  }>
  options?: PhotoSwipeOptions
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({}),
})

const emit = defineEmits<{
  open: [index: number]
  close: []
  change: [index: number]
}>()

const galleryRef = ref<HTMLElement | null>(null)

let pswp: InstanceType<typeof import('photoswipe').default> | null = null
let instanceId = 0

const LOADING_SVG = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" class="w-12 h-12 text-white/80 animate-spin"><circle cx="16" cy="16" r="14" stroke-opacity="0.2"/><path d="M16 2a14 14 0 0 1 14 14" stroke-linecap="round"/></svg>`

/** 获取图片真实尺寸 */
function resolveImageSize(src: string): Promise<SlideData> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ src, width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ src, width: window.innerWidth, height: window.innerHeight })
    img.src = src
  })
}

/** 打开指定索引的图片 */
async function openAt(index: number) {
  if (!props.images[index])
    return

  // 销毁之前的实例
  pswp?.destroy()

  const currentId = ++instanceId

  // 动态导入 PhotoSwipe
  const PhotoSwipe = (await import('photoswipe')).default

  // 初始化 dataSource：先用 loading 占位，设置缩略图预览
  const imgElements = galleryRef.value?.querySelectorAll<HTMLImageElement>('img')
  const dataSource: SlideData[] = props.images.map((img, i) => ({
    html: LOADING_SVG,
    msrc: img.src,
    element: imgElements?.[i],
  }))

  pswp = new PhotoSwipe({
    dataSource,
    index,
    // 显示配置
    bgOpacity: 0.95,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
    showHideAnimationType: 'zoom',
    showAnimationDuration: 333,
    hideAnimationDuration: 333,
    zoomAnimationDuration: 333,
    // 交互配置
    wheelToZoom: true,
    pinchToClose: true,
    closeOnVerticalDrag: true,
    arrowKeys: true,
    returnFocus: true,
    trapFocus: true,
    // 预加载配置
    preload: [1, 2],
    // 合并自定义配置
    ...props.options,
  })

  pswp.on('beforeOpen', () => emit('open', pswp?.currIndex ?? 0))
  pswp.on('close', () => emit('close'))
  pswp.on('change', () => emit('change', pswp?.currIndex ?? 0))
  pswp.on('destroy', () => {
    if (instanceId === currentId)
      pswp = null
  })

  pswp.init()

  // 异步加载图片尺寸并刷新
  props.images.forEach(async (img, i) => {
    const size = await resolveImageSize(img.src)
    if (instanceId !== currentId)
      return

    dataSource[i] = { ...size, msrc: img.src, alt: img.alt }
    pswp?.refreshSlideContent(i)
  })
}

/** 关闭画廊 */
function close() {
  pswp?.close()
}

onBeforeUnmount(() => {
  pswp?.destroy()
  pswp = null
})

defineExpose({ openAt, close })
</script>

<template>
  <div ref="galleryRef" class="photoswipe-gallery">
    <slot :open-at="openAt" :close="close" />
  </div>
</template>

<style>
.pswp {
  --pswp-bg: rgba(0, 0, 0, 0.95);
}
</style>
