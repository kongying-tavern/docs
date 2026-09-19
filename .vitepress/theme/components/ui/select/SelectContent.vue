<script setup lang="ts">
import type { SelectContentEmits, SelectContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  SelectContent,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed, useTemplateRef } from 'vue'
import { useFluidHover, useFluidHoverIndicator } from '@/hooks/fluid-hover'
import { cn } from '@/lib/utils'
import { SelectScrollDownButton, SelectScrollUpButton } from '.'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<SelectContentProps & { class?: HTMLAttributes['class'], fluid?: boolean }>(),
  {
    position: 'popper',
    fluid: false,
  },
)
const emits = defineEmits<SelectContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'fluid')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// fluid 的容器是包住 slot 的自有元素：ref 一定指向真实 DOM，不依赖 reka 对 portal 根组件
// 的 $el 解析（那会落到 teleport 占位元素上，导致测量静默失效）
const containerRef = useTemplateRef<HTMLElement | null>('container')
const indicatorRef = useTemplateRef<HTMLElement | null>('indicator')
const container = computed(() => (props.fluid ? containerRef.value : null))

useFluidHover(container, { axis: 'y' })
useFluidHoverIndicator(container, indicatorRef, { motion: 'fast' })
</script>

<template>
  <SelectPortal>
    <SelectContent
      data-slot="select-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(
        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--reka-select-content-available-height) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border shadow-md',
        position === 'popper'
          && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        props.class,
      )
      "
    >
      <SelectScrollUpButton />
      <SelectViewport :class="cn('p-1', position === 'popper' && 'h-(--reka-select-trigger-height) w-full min-w-(--reka-select-trigger-width) scroll-my-1')">
        <div
          v-if="fluid"
          ref="container"
          class="relative"
        >
          <div
            ref="indicator"
            aria-hidden="true"
            class="rounded-sm bg-accent h-0 w-0 pointer-events-none left-0 top-0 absolute z-0"
          />
          <slot />
        </div>
        <slot v-else />
      </SelectViewport>
      <SelectScrollDownButton />
    </SelectContent>
  </SelectPortal>
</template>
