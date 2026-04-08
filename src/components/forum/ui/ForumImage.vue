<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhotoSwipe } from '@/components/ui/photoswipe'
import ForumImageItem from './ForumImageItem.vue'

/** 图片项接口 */
export interface ImageItem {
  src: string
  alt?: string
  width?: number
  height?: number
  thumbHash?: string
  thumbhash?: string
}

type LayoutMode = 'auto' | 'single' | 'double' | 'triple' | 'quad' | 'gallery' | 'row'

interface Props {
  images: ImageItem[]
  layout?: LayoutMode
  /** row 布局下最多显示几张图片 */
  maxDisplay?: number
  containerClass?: string
  imageClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'auto',
  maxDisplay: 3,
  containerClass: '',
  imageClass: '',
})

/** 错误状态追踪 */
const errorMap = ref(new Set<number>())

/** 计算实际布局模式 */
const actualLayout = computed<Exclude<LayoutMode, 'auto'>>(() => {
  if (props.layout !== 'auto')
    return props.layout

  const count = props.images.length
  const layoutMap: Record<number, Exclude<LayoutMode, 'auto'>> = {
    1: 'single',
    2: 'double',
    3: 'triple',
    4: 'quad',
  }
  return layoutMap[count] ?? 'gallery'
})

/** 是否为填充模式（所有布局都使用 object-cover） */
const isFillMode = computed(() => true)

/** 显示的图片列表 */
const displayImages = computed(() => {
  const layout = actualLayout.value
  if (layout === 'row')
    return props.images.slice(0, props.maxDisplay)
  if (layout === 'gallery')
    return props.images.slice(0, 4)
  return props.images
})

/** 剩余图片数量 */
const remainingCount = computed(() => {
  const layout = actualLayout.value
  if (layout === 'row')
    return props.images.length - props.maxDisplay
  if (layout === 'gallery')
    return props.images.length - 4
  return 0
})

/** 有效图片列表（用于 PhotoSwipe） */
const validImages = computed(() =>
  props.images.filter((_, i) => !errorMap.value.has(i)),
)

/** 获取有效图片索引 */
function getValidIndex(index: number): number {
  let count = 0
  for (let i = 0; i < index; i++) {
    if (!errorMap.value.has(i))
      count++
  }
  return count
}

/** 处理图片加载错误 */
function handleError(index: number) {
  errorMap.value.add(index)
}

/** 布局配置 */
// @unocss-include
const layoutConfig = computed(() => {
  const layout = actualLayout.value

  // 容器样式
  // @unocss-include
  const containerStyles: Record<string, string> = {
    row: 'flex gap-4 max-w-[80%]',
    gallery: 'grid grid-cols-2 grid-rows-2 gap-0 max-h-[400px] rounded-lg overflow-hidden',
    single: 'grid grid-cols-1 max-h-[500px] gap-0',
    double: 'grid grid-cols-2 gap-0 max-h-[400px]',
    triple: 'grid grid-cols-2 grid-rows-2 h-[400px] gap-0',
    quad: 'grid grid-cols-2 grid-rows-2 max-h-[400px] rounded-lg overflow-hidden',
  }

  // 图片项样式（圆角配置）- 所有类名静态声明以便 UnoCSS 扫描
  // @unocss-include
  const baseStyles = 'w-full h-full'
  // @unocss-include
  const cornerStyles: Record<string, Record<number, string>> = {
    single: { 0: 'rounded-lg max-h-[400px]' },
    double: { 0: 'rounded-l-lg', 1: 'rounded-r-lg' },
    triple: { 0: 'rounded-l-lg', 1: 'rounded-tr-lg', 2: 'rounded-br-lg' },
    quad: { 0: '', 1: '', 2: '', 3: '' },
    gallery: { 0: '', 1: '', 2: '', 3: '' },
  }

  const getItemStyle = (index: number): string => {
    if (layout === 'row')
      return 'h-100px w-[30%] rounded'

    const cornerClass = cornerStyles[layout]?.[index] ?? ''
    return `${baseStyles} ${cornerClass}`
  }

  return {
    containerStyle: containerStyles[layout] ?? '',
    getItemStyle,
  }
})

/** Triple 布局的 grid 位置类 - 按索引对应 */
// @unocss-include
const tripleGridClasses = ['row-span-2', 'col-start-2 row-start-1', 'col-start-2 row-start-2']
</script>

<template>
  <PhotoSwipe
    v-if="images.length > 0"
    :images="validImages"
    :class="containerClass"
  >
    <template #default="{ openAt }">
      <div :class="[layoutConfig.containerStyle, containerClass]">
        <div
          v-for="(image, index) in displayImages"
          :key="image.src"
          class="border border-[var(--vp-c-divider)] transition-colors relative overflow-hidden hover:border-[var(--vp-c-brand)]"
          :class="[layoutConfig.getItemStyle(index), actualLayout === 'triple' ? tripleGridClasses[index] : '']"
        >
          <ForumImageItem
            :image="image"
            :fill-container="isFillMode"
            :class="imageClass"
            @click="openAt(getValidIndex(index))"
            @error="handleError(index)"
          />

          <!-- 剩余图片数量标记 -->
          <div
            v-if="index === displayImages.length - 1 && remainingCount > 0"
            class="text-xs text-white px-1.5 py-0.5 rounded bg-black/60 right-1 top-1 absolute backdrop-blur-sm"
          >
            +{{ remainingCount }}
          </div>
        </div>
      </div>
    </template>
  </PhotoSwipe>
</template>

<style scoped>
/* 三张图片布局 - 第一张图片占两行 */
.grid:has(.row-span-2) {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

/* 四宫格布局 - 固定高度 */
.grid-cols-2.grid-rows-2 {
  height: 400px;
}

/* Grid 布局边框覆盖：使用负边距让相邻边框重叠 */
.grid > div {
  border: 1px solid var(--vp-c-divider);
  margin: -0.5px;
  z-index: 1;
}

.grid > div:hover {
  border-color: var(--vp-c-brand);
  z-index: 2;
}

/* 响应式：小屏幕下单列布局 */
@container (max-width: 500px) {
  .grid-cols-2 {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
  }

  .row-span-2 {
    grid-row: span 1 !important;
  }

  .grid-rows-2 {
    height: auto !important;
  }
}
</style>
