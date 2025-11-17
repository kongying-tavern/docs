<script lang="ts" setup>
import type { DefaultTheme } from 'vitepress/theme-without-fonts'

import { computed } from 'vue'
import ExpandableGallery from '../ExpandableGallery.vue'
import Image from './Image.vue'

interface Props {
  images: DefaultTheme.ThemeableImage[]
  /**
   * 布局模式
   * auto: 根据图片数量自动选择布局
   * single: 单张图片布局
   * double: 双张图片布局
   * triple: 三张图片布局
   * quad: 四张图片布局
   * gallery: 展示模式（5张以上）
   */
  layout?: 'auto' | 'single' | 'double' | 'triple' | 'quad' | 'gallery'
  /**
   * 最大展示图片数量，超过则显示展开按钮
   */
  maxDisplay?: number
  /**
   * 是否可展开查看更多图片
   */
  expandable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'auto',
  maxDisplay: 4,
  expandable: true,
})

const emit = defineEmits<{
  expand: [images: DefaultTheme.ThemeableImage[]]
  imageClick: [image: DefaultTheme.ThemeableImage, index: number]
}>()

// 计算实际布局模式
const actualLayout = computed(() => {
  if (props.layout !== 'auto')
    return props.layout

  const count = props.images.length
  if (count === 1)
    return 'single'
  if (count === 2)
    return 'double'
  if (count === 3)
    return 'triple'
  if (count === 4)
    return 'quad'
  return 'gallery'
})

// 判断是否需要展开功能
const needsExpansion = computed(() => {
  return props.expandable && props.images.length > props.maxDisplay
})

// 显示的图片列表
const displayImages = computed(() => {
  if (!needsExpansion.value)
    return props.images
  return props.images.slice(0, props.maxDisplay)
})

// 剩余图片数量
const remainingCount = computed(() => {
  return Math.max(0, props.images.length - props.maxDisplay)
})

// Grid 布局类名
const gridClass = computed(() => {
  const layout = actualLayout.value

  switch (layout) {
    case 'single':
      return 'grid-cols-1'
    case 'double':
      return 'grid-cols-2'
    case 'triple':
      return 'grid-cols-2 grid-rows-2'
    case 'quad':
      return 'grid-cols-2 grid-rows-2'
    default:
      return 'grid-cols-1'
  }
})

const imgsUrl = computed(() => props.images.map(i =>
  typeof i === 'string'
    ? i
    : 'src' in i
      ? i.src
      : i.light),
)

// 获取图片的样式类
function getImageClass(index: number): string {
  const layout = actualLayout.value
  const isLastSlot = needsExpansion.value && index === displayImages.value.length - 1

  let baseClass = 'relative w-full h-full overflow-hidden'

  // 根据布局添加特殊样式和圆角
  if (layout === 'single') {
    baseClass += ' col-span-1 aspect-auto rounded-lg max-h-[400px]'
  }
  else if (layout === 'double') {
    // 两张图片：左右布局
    if (index === 0)
      baseClass += ' rounded-l-lg'
    if (index === 1)
      baseClass += ' rounded-r-lg'
  }
  else if (layout === 'triple') {
    // 三张图片：第一张占左边，后两张右边上下
    if (index === 0) {
      baseClass += ' row-span-2 rounded-l-lg' // 左侧圆角
    }
    else if (index === 1) {
      baseClass += ' rounded-tr-lg' // 右上角圆角
    }
    else if (index === 2) {
      baseClass += ' rounded-br-lg' // 右下角圆角
    }
  }
  else if (layout === 'quad') {
    // 四张图片：四宫格布局
    if (index === 0)
      baseClass += ' rounded-tl-lg'
    if (index === 1)
      baseClass += ' rounded-tr-lg'
    if (index === 2)
      baseClass += ' rounded-bl-lg'
    if (index === 3)
      baseClass += ' rounded-br-lg'
  }

  // 展开按钮位置的特殊样式
  if (isLastSlot) {
    baseClass += ' image-expand-overlay'
  }

  return baseClass
}

// 处理图片点击
function handleImageClick(image: DefaultTheme.ThemeableImage, index: number) {
  emit('imageClick', image, index)
}

// 处理展开点击
function handleExpand() {
  emit('expand', props.images)
}
</script>

<template>
  <div
    v-if="actualLayout !== 'gallery'"
    :class="`images-container grid gap-0 max-h-[400px] ${gridClass}`"
    :data-layout="actualLayout"
    :data-count="images.length"
  >
    <div
      v-for="(image, index) in displayImages"
      :key="index"
      :class="getImageClass(index)"
      @click="handleImageClick(image, index)"
    >
      <Image
        class="size-full cursor-pointer object-cover transition-transform duration-200 hover:scale-105"
        :image="image"
        :preload="index === 0"
      />

      <!-- 展开更多按钮 -->
      <div
        v-if="needsExpansion && index === displayImages.length - 1"
        class="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 text-white transition-opacity duration-200 hover:bg-black/70"
        @click.stop="handleExpand"
      >
        <div class="text-center">
          <div class="i-lucide-images mb-2 size-8" />
          <div class="text-sm font-medium">
            +{{ remainingCount }} 张
          </div>
        </div>
      </div>
    </div>
  </div>
  <ExpandableGallery v-else :images="imgsUrl" />
</template>

<style scoped>
.images-container {
  container-type: inline-size;
}

/* 响应式适配 */
@container (max-width: 500px) {
  .images-container[data-layout="double"] {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(2, 1fr);
  }

  .images-container[data-layout="triple"] {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(3, 1fr);
  }

  .images-container[data-layout="triple"] > div {
    row-span: 1 !important;
  }

  .images-container[data-layout="quad"] {
    grid-template-columns: 1fr 1fr;
  }
}

/* 图片悬停效果 */
.images-container :deep(.VPImage) {
  border: 1px solid var(--vp-c-divider);
  transition: all 0.2s ease;
  width: 100%;
  height: 100%;
  display: block;
}

.images-container :deep(.VPImage:hover) {
  border-color: var(--vp-c-brand);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 确保图片容器占满全部空间 */
.images-container > div {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.images-container > div > * {
  flex: 1;
  height: 100%;
}

/* 展开按钮样式 */
.image-expand-overlay {
  position: relative;
}

.image-expand-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6));
  border-radius: inherit;
  z-index: 1;
}

/* 布局特定样式 */
.images-container[data-layout="single"] {
  max-height: 500px;
}

.images-container[data-layout="single"] img {
  object-fit: contain;
  max-height: 500px;
}

/* 三张图片布局特殊处理 */
.images-container[data-layout="triple"] {
  height: 400px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.images-container[data-layout="triple"] > div:first-child {
  grid-row: 1 / 3;
  grid-column: 1;
  display: flex;
  height: 100%;
}

.images-container[data-layout="triple"] > div:first-child :deep(.VPImage),
.images-container[data-layout="triple"] > div:first-child :deep(img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}

.images-container[data-layout="triple"] > div:nth-child(2) {
  grid-row: 1;
  grid-column: 2;
  display: flex;
  height: 100%;
}

.images-container[data-layout="triple"] > div:nth-child(3) {
  grid-row: 2;
  grid-column: 2;
  display: flex;
  height: 100%;
}

.images-container[data-layout="triple"] > div:nth-child(2) :deep(.VPImage),
.images-container[data-layout="triple"] > div:nth-child(2) :deep(img),
.images-container[data-layout="triple"] > div:nth-child(3) :deep(.VPImage),
.images-container[data-layout="triple"] > div:nth-child(3) :deep(img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}

/* 移除默认圆角，由组件动态控制 */
.images-container :deep(.VPImage) {
  border-radius: 0;
  overflow: hidden;
}

/* 四张图片布局 */
.images-container[data-layout="quad"] {
  max-height: 400px;
}
</style>
