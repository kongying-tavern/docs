<script setup lang="ts">
import type { IconInput, SpringPreset } from 'morphicons'
import type { MorphHandle, ReducedMotionMode } from 'morphicons/vue'
import type { HTMLAttributes } from 'vue'
import { MorphIcon as MorphIconCore } from 'morphicons/vue'
import { useTemplateRef } from 'vue'

const props = withDefaults(defineProps<{
  icon?: IconInput
  from?: IconInput
  to?: IconInput
  progress?: number
  spring?: SpringPreset | Record<string, unknown>
  reducedMotion?: ReducedMotionMode
  size?: number | string
  color?: string
  strokeWidth?: number | string
  absoluteStrokeWidth?: boolean
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  icon: undefined,
  from: undefined,
  to: undefined,
  progress: undefined,
  spring: undefined,
  reducedMotion: 'never',
  size: 20,
  color: 'currentColor',
  strokeWidth: 2,
  absoluteStrokeWidth: false,
  label: undefined,
})

const core = useTemplateRef<MorphHandle>('core')

defineExpose<MorphHandle>({
  morphTo: (icon, spring) => core.value?.morphTo(icon, spring),
  set: icon => core.value?.set(icon),
})
</script>

<template>
  <span class="inline-block" :class="props.class">
    <MorphIconCore
      ref="core"
      :icon="icon"
      :from="from"
      :to="to"
      :progress="progress"
      :spring="spring"
      :reduced-motion="reducedMotion"
      :size="size"
      :color="color"
      :stroke-width="strokeWidth"
      :absolute-stroke-width="absoluteStrokeWidth"
      :label="label"
    />
  </span>
</template>
