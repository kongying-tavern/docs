<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FluidHoverAxis } from '@/hooks/fluid-hover'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useFluidHover, useFluidHoverIndicator } from '@/hooks/fluid-hover'
import { onAncestorMotionEnd } from '@/hooks/fluid-hover/measure'
import { cn } from '@/lib/utils'
import { useSectionScrollSpy } from './useSectionScrollSpy'

const props = withDefaults(defineProps<{
  /** 列表方向：纵向 y、横排 x、网格 xy（两列/多列必须用 xy） */
  axis?: FluidHoverAxis
  /** indicator 移动档位：fast 跟手、moderate 适合较大面板 */
  motion?: 'fast' | 'moderate' | 'slow'
  /** 点击行间空隙是否转发给当前高亮行（默认关闭） */
  gapClick?: boolean | { maxDistance?: number }
  /** 激活项选择器：渲染固定高亮标记，独立于悬停 indicator */
  active?: string
  /** 激活标记底色，默认与 indicator 一致 */
  activeIndicatorClass?: string
  /** 滚动联动区段 id；配合 scroller 使用时按视口位置 emit update:active */
  sectionIds?: string[]
  /** 内容滚动容器选择器（可位于本列表之外） */
  scroller?: string
  /** indicator 圆角等样式，默认与行一致取 8px */
  indicatorClass?: string
  class?: HTMLAttributes['class']
}>(), {
  axis: 'y',
  motion: 'fast',
  gapClick: false,
  activeIndicatorClass: 'bg-accent',
  indicatorClass: 'rounded-lg',
})

const emit = defineEmits<{
  /** 内容滚动跨过区段边界时触发 */
  'update:active': [section: string]
}>()

const container = useTemplateRef<HTMLElement | null>('container')
const indicator = useTemplateRef<HTMLElement | null>('indicator')
const activeIndicator = useTemplateRef<HTMLElement | null>('activeIndicator')

useFluidHover(container, { axis: props.axis, gapClick: props.gapClick })
useFluidHoverIndicator(container, indicator, { motion: props.motion })

// —— 激活项固定标记：独立于悬停 indicator，悬停与滚动联动都不影响它 ——
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined
let scrollFrameActive = 0

function syncActiveIndicator(): void {
  const box = activeIndicator.value
  const root = container.value
  if (!box)
    return
  const target = props.active && root
    ? root.querySelector<HTMLElement>(props.active)
    : null
  if (!target) {
    box.style.opacity = '0'
    return
  }
  const containerRect = root!.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  box.style.opacity = '1'
  box.style.top = `${targetRect.top - containerRect.top}px`
  box.style.left = `${targetRect.left - containerRect.left}px`
  box.style.width = `${targetRect.width}px`
  box.style.height = `${targetRect.height}px`
}

watch(container, (element, _previous, onCleanup) => {
  if (!element)
    return
  resizeObserver = new ResizeObserver(() => syncActiveIndicator())
  resizeObserver.observe(element)
  mutationObserver = new MutationObserver(() => syncActiveIndicator())
  mutationObserver.observe(element, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
  })
  const onScroll = () => {
    cancelAnimationFrame(scrollFrameActive)
    scrollFrameActive = requestAnimationFrame(syncActiveIndicator)
  }
  // 祖先入场缩放动画中途量到的 rect 是中间值，动画结束时需重新校准
  const stopMotionEnd = onAncestorMotionEnd(element, syncActiveIndicator)
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  onCleanup(() => {
    resizeObserver?.disconnect()
    mutationObserver?.disconnect()
    stopMotionEnd()
    window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions)
  })
}, { flush: 'post' })

watch(() => props.active, () => {
  nextTick(syncActiveIndicator)
})

// —— 滚动联动：滚动位置跨过区段边界 → update:active ——
const scrollerEl = ref<HTMLElement | null>(null)

function resolveScroller(): void {
  scrollerEl.value = props.scroller
    ? document.querySelector<HTMLElement>(props.scroller)
    : null
}

const { scrollTo: scrollToSpy } = useSectionScrollSpy({
  scroller: scrollerEl,
  sectionIds: () => props.sectionIds ?? [],
  onActiveChange: section => emit('update:active', section),
})

/** 滚动到区段；未纳入联动的区段（无对应元素）回落为滚回顶部 */
function scrollTo(section: string, behavior?: ScrollBehavior): void {
  const finalBehavior = behavior
    ?? (document.documentElement.dataset.reducedMotion === 'true' ? 'auto' : 'smooth')
  if (props.sectionIds?.includes(section)) {
    scrollToSpy(section, finalBehavior)
  }
  else {
    scrollerEl.value?.scrollTo({ top: 0, behavior: finalBehavior })
  }
}

watch(() => props.scroller, resolveScroller)

onMounted(resolveScroller)

onBeforeUnmount(() => {
  cancelAnimationFrame(scrollFrameActive)
})

defineExpose({ scrollTo })
</script>

<template>
  <div
    ref="container"
    :class="cn('relative', props.class)"
  >
    <div
      ref="indicator"
      aria-hidden="true"
      :class="cn('pointer-events-none absolute left-0 top-0 z-0 h-0 w-0 rounded-lg bg-accent', props.indicatorClass)"
    />
    <div
      ref="activeIndicator"
      aria-hidden="true"
      :class="cn('pointer-events-none absolute left-0 top-0 z-0 h-0 w-0 rounded-lg', props.activeIndicatorClass)"
    />
    <slot />
  </div>
</template>
