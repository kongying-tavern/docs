<script setup lang="ts">
import { useIntersectionObserver, useMounted } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useSitePreferences } from '~/composables/useSitePreferences'

interface BlurFadeProps {
  class?: string
  duration?: number
  delay?: number
  yOffset?: number
  inView?: boolean
  blur?: string
  inViewMargin?: string
}

const props = withDefaults(defineProps<BlurFadeProps>(), {
  duration: 0.4,
  delay: 500,
  yOffset: 6,
  inView: false,
  inViewMargin: '-50px',
  blur: '6px',
})
const target = useTemplateRef<HTMLElement>('target')
const mounted = useMounted()
const { reducedMotion } = useSitePreferences()
const revealed = ref(false)
const { isSupported, stop } = useIntersectionObserver(target, ([entry]) => {
  if (entry?.isIntersecting) {
    revealed.value = true
    stop()
  }
}, { rootMargin: props.inViewMargin, immediate: props.inView })
const entered = computed(() => !props.inView || revealed.value || !isSupported.value)
const animationStyle = computed(() => ({
  '--blur-fade-from': `${props.yOffset}px`,
  '--blur-fade-to': `${-props.yOffset}px`,
  '--blur-fade-blur': props.blur,
  '--blur-fade-duration': `${props.duration}s`,
  '--blur-fade-delay': `${props.delay}ms`,
}))
</script>

<template>
  <div
    ref="target" class="blur-fade" :class="props.class" :style="animationStyle"
    :data-pending="mounted && !reducedMotion && !entered"
    :data-entered="mounted && !reducedMotion && entered"
  >
    <slot />
  </div>
</template>

<style scoped>
.blur-fade[data-pending='true'] {
  opacity: 0;
  transform: translateY(var(--blur-fade-from));
  filter: blur(var(--blur-fade-blur));
}

.blur-fade[data-entered='true'] {
  animation: blur-fade var(--blur-fade-duration) ease-in var(--blur-fade-delay) both;
}

@keyframes blur-fade {
  from {
    opacity: 0;
    transform: translateY(var(--blur-fade-from));
    filter: blur(var(--blur-fade-blur));
  }

  to {
    opacity: 1;
    transform: translateY(var(--blur-fade-to));
    filter: blur(0);
  }
}

html[data-reduced-motion='true'] .blur-fade {
  animation: none;
  opacity: 1;
  transform: none;
  filter: none;
}
</style>
