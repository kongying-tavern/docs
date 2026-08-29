<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  value: number | string
  duration?: number
  distance?: number
  blur?: number
  stagger?: number
  class?: HTMLAttributes['class']
}>(), {
  duration: 500,
  distance: 8,
  blur: 2,
  stagger: 0,
})

const replayKey = ref(0)
watch(() => props.value, () => {
  replayKey.value += 1
})

const digits = computed(() => String(props.value).split(''))
const groupStyle = computed(() => ({
  '--digit-dur': `${props.duration}ms`,
  '--digit-distance': `${props.distance}px`,
  '--digit-blur': `${props.blur}px`,
}))

function digitStyle(index: number) {
  return { animationDelay: `${index * props.stagger}ms` }
}
</script>

<template>
  <span :key="replayKey" class="t-digit-group" :class="props.class" :style="groupStyle">
    <span
      v-for="(char, index) in digits"
      :key="index"
      class="t-digit"
      :style="digitStyle(index)"
    >{{ char }}</span>
  </span>
</template>

<style scoped>
.t-digit-group {
  display: inline-flex;
  align-items: baseline;
}

.t-digit {
  display: inline-block;
  animation: t-digit-pop-in var(--digit-dur) cubic-bezier(0.34, 1.45, 0.64, 1) both;
  will-change: transform, opacity, filter;
}

@keyframes t-digit-pop-in {
  0% {
    transform: translate(0, var(--digit-distance));
    opacity: 0;
    filter: blur(var(--digit-blur));
  }
  100% {
    transform: translate(0, 0);
    opacity: 1;
    filter: blur(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .t-digit {
    animation: none;
  }
}
</style>
