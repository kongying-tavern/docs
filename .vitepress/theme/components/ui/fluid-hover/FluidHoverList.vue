<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FluidHoverAxis } from '@/hooks/fluid-hover'
import { useTemplateRef } from 'vue'
import { useFluidHover, useFluidHoverIndicator } from '@/hooks/fluid-hover'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** 列表方向：纵向 y、横排 x、网格 xy（两列/多列必须用 xy） */
  axis?: FluidHoverAxis
  /** indicator 移动档位：fast 跟手、moderate 适合较大面板 */
  motion?: 'fast' | 'moderate' | 'slow'
  /** 点击行间空隙是否转发给当前高亮行（默认关闭） */
  gapClick?: boolean | { maxDistance?: number }
  /** indicator 圆角等样式，默认与行一致取 8px */
  indicatorClass?: string
  class?: HTMLAttributes['class']
}>(), {
  axis: 'y',
  motion: 'fast',
  gapClick: false,
  indicatorClass: 'rounded-lg',
})

const container = useTemplateRef<HTMLElement | null>('container')
const indicator = useTemplateRef<HTMLElement | null>('indicator')

useFluidHover(container, { axis: props.axis, gapClick: props.gapClick })
useFluidHoverIndicator(container, indicator, { motion: props.motion })
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
    <slot />
  </div>
</template>
