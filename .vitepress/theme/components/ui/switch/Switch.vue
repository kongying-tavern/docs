<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useMediaQuery } from '@vueuse/core'
import {
  SwitchRoot,
  SwitchThumb,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const pressed = ref(false)
const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const uncontrolledValue = ref(props.defaultValue ?? props.falseValue ?? false)
const modelValue = computed(() => props.modelValue ?? uncontrolledValue.value)
const checked = computed(() => modelValue.value === (props.trueValue ?? true))

const pulseActive = ref(false)
watch(checked, () => {
  pulseActive.value = true
})
function onThumbAnimationEnd(event: AnimationEvent) {
  if (event.animationName === 'switch-thumb-pulse')
    pulseActive.value = false
}
</script>

<template>
  <SwitchRoot
    v-slot="slotProps"
    data-slot="switch"
    v-bind="forwarded"
    :class="cn(
      'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/35 pointer-fine:hover:data-[state=unchecked]:bg-muted-foreground/50 focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2 inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border shadow-xs transition-all motion-reduce:transition-none outline-none disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    @update:model-value="uncontrolledValue = $event"
    @pointerdown="pressed = true"
    @pointerup="pressed = false"
    @pointerleave="pressed = false"
    @pointercancel="pressed = false"
    @keydown.space="pressed = true"
    @keyup.space="pressed = false"
    @blur="pressed = false"
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="cn(
        'pointer-events-none block size-4 rounded-full bg-background dark:bg-foreground ring-0 switch-thumb-motion motion-reduce:transition-none',
        pressed && !reduceMotion
          ? (checked ? 'scale-x-[1.25] translate-x-[16px]' : 'scale-x-[1.25] translate-x-[5px]')
          : (checked ? 'translate-x-[18px]' : 'translate-x-[3px]'),
        pulseActive && !reduceMotion && 'switch-thumb-pulse',
      )"
      @animationend="onThumbAnimationEnd"
    >
      <slot name="thumb" v-bind="slotProps" />
    </SwitchThumb>
  </SwitchRoot>
</template>
