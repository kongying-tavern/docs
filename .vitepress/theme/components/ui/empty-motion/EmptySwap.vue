<script setup lang="ts">
import { computed } from 'vue'
import { useSitePreferences } from '~/composables/useSitePreferences'

const props = withDefaults(defineProps<{
  swapKey: string | number
  /** copy: 文案整行 roll，供标题/描述；icon: 贴片内图标 crossfade，首次挂载 settle-in */
  variant?: 'copy' | 'icon'
  as?: string
}>(), {
  variant: 'copy',
  as: 'span',
})

const { reducedMotion } = useSitePreferences()
const transitionName = computed(() =>
  reducedMotion.value ? 'es-reduce' : props.variant === 'icon' ? 'es-icon' : 'es-copy')

// 退场内容仍在 DOM 中参与过渡，对辅助技术隐藏以免新旧文案被同时朗读
function hideLeaving(el: Element) {
  el.setAttribute('aria-hidden', 'true')
}
</script>

<template>
  <component
    :is="props.as"
    class="es-swap"
    :class="props.variant === 'icon' ? 'es-swap-icon' : 'es-swap-copy'"
    :aria-hidden="props.variant === 'icon' ? true : undefined"
  >
    <Transition :name="transitionName" :appear="props.variant === 'icon'" @leave="hideLeaving">
      <span :key="props.swapKey" class="es-swap-line">
        <slot />
      </span>
    </Transition>
  </component>
</template>

<style scoped>
.es-swap-copy {
  position: relative;
  display: block;
  width: 100%;
}

.es-swap-icon {
  position: relative;
  display: inline-grid;
  place-items: center;
}

.es-swap-line {
  display: block;
  text-wrap: balance;
}

.es-copy-enter-active {
  transition:
    opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.es-copy-leave-active {
  position: absolute;
  inset-inline: 0;
  top: 0;
  transition:
    opacity 0.16s ease,
    transform 0.16s ease,
    filter 0.16s ease;
}

.es-copy-enter-from {
  opacity: 0;
  transform: translateY(0.3em);
  filter: blur(6px);
}

.es-copy-leave-to {
  opacity: 0;
  transform: translateY(-0.3em);
  filter: blur(3px);
}

.es-icon-enter-active,
.es-icon-leave-active,
.es-icon-appear-active {
  grid-area: 1 / 1;
}

.es-icon-enter-active {
  transition:
    opacity 0.36s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.36s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 0.36s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.es-icon-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease,
    filter 0.16s ease;
}

.es-icon-enter-from,
.es-icon-leave-to {
  opacity: 0;
  transform: scale(0.6);
  filter: blur(3px);
}

.es-icon-appear-active {
  transition:
    opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.es-icon-appear-from {
  opacity: 0;
  transform: scale(0.92);
}

/* 减动效下退场仍脱离文档流，避免高度在退场期间跳变 */
.es-reduce-enter-active,
.es-reduce-leave-active {
  transition: opacity 0.1s linear;
}

.es-reduce-leave-active {
  position: absolute;
  inset-inline: 0;
  top: 0;
}

.es-reduce-enter-from,
.es-reduce-leave-to {
  opacity: 0;
}
</style>
