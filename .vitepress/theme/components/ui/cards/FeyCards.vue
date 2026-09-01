<script lang="ts" setup>
import { usePreferredReducedMotion } from '@vueuse/core'
import { motion } from 'motion-v'
import { computed, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

interface SpringConfig {
  type: 'spring'
  bounce?: number
  visualDuration?: number
  stiffness?: number
  damping?: number
  mass?: number
}

interface FeyCardItem {
  src: string
  sourceIndex: number
}

interface FeyCardsProps {
  cardSpacing?: number
  spring?: SpringConfig
  shiftDistance?: number
  entranceStagger?: number
  imgSrc?: string[]
  ariaLabels?: string[]
  active?: number
  width?: number
  height?: number
  class?: string
}

const props = withDefaults(defineProps<FeyCardsProps>(), {
  cardSpacing: 32,
  spring: () => ({
    type: 'spring',
    visualDuration: 0.5,
    bounce: 0.2,
  }),
  shiftDistance: 60,
  entranceStagger: 0.2,
  imgSrc: () => [],
  ariaLabels: () => [],
  active: 0,
  width: 160,
  height: 480,
})

const emit = defineEmits<{ select: [index: number] }>()

const reducedMotion = usePreferredReducedMotion()
const hovered = ref<number | null>(null)
const entered = ref(false)

const cards = computed<FeyCardItem[]>(() => {
  const items = props.imgSrc.map((src, sourceIndex) => ({ src, sourceIndex }))
  if (items.length < 2)
    return items

  const active = ((props.active % items.length) + items.length) % items.length
  return [...items.slice(active), ...items.slice(0, active)]
})

const hoveredPosition = computed(() =>
  cards.value.findIndex(card => card.sourceIndex === hovered.value),
)

function cardX(position: number): number {
  const hoverShift = hoveredPosition.value >= 0 && position > hoveredPosition.value
    ? props.shiftDistance
    : 0
  return position * props.cardSpacing + hoverShift
}

onMounted(() => {
  requestAnimationFrame(() => {
    entered.value = true
  })
})
</script>

<template>
  <div
    :class="cn('fey-cards', props.class)"
    :style="{
      width: `${width + Math.max(cards.length - 1, 0) * cardSpacing + shiftDistance}px`,
      height: `${height}px`,
      maxWidth: '420px',
      maxHeight: '640px',
    }"
  >
    <motion.button
      v-for="(card, position) in cards"
      :key="card.sourceIndex"
      type="button"
      class="fey-card"
      :class="{ 'is-active': card.sourceIndex === cards[0]?.sourceIndex }"
      :style="{
        width: `${width}px`,
        height: `${height}px`,
        zIndex: cards.length - position,
      }"
      :initial="{ x: -position * cardSpacing, opacity: 0 }"
      :animate="{
        x: cardX(position),
        y: card.sourceIndex === hovered ? 4 : 0,
        opacity: 1,
      }"
      :transition="{
        ...(reducedMotion === 'reduce' ? { duration: 0 } : spring),
        delay: reducedMotion === 'reduce' || entered ? 0 : (cards.length - 1 - position) * entranceStagger,
      }"
      :aria-label="ariaLabels[card.sourceIndex] || String(card.sourceIndex + 1)"
      :aria-current="card.sourceIndex === cards[0]?.sourceIndex ? 'true' : undefined"
      @mouseenter="hovered = card.sourceIndex"
      @focus="hovered = card.sourceIndex"
      @mouseleave="hovered = null"
      @blur="hovered = null"
      @pointerdown.stop
      @click.stop="emit('select', card.sourceIndex)"
    >
      <span class="fey-card-surface">
        <img
          :src="card.src"
          alt=""
          class="fey-card-image"
          draggable="false"
        >
      </span>
    </motion.button>
  </div>
</template>

<style scoped>
.fey-cards {
  --fey-card-border: color-mix(in srgb, var(--vp-c-white) 28%, transparent);
  --fey-card-border-active: color-mix(in srgb, var(--vp-c-white) 58%, transparent);
  --fey-card-bg: color-mix(in srgb, var(--vp-c-white) 12%, transparent);
  --fey-card-highlight: color-mix(in srgb, var(--vp-c-white) 20%, transparent);
  --fey-card-focus: color-mix(in srgb, var(--vp-c-white) 90%, transparent);
  --fey-card-shadow: color-mix(in srgb, var(--vp-c-black) 34%, transparent);
  --fey-card-shadow-active: color-mix(in srgb, var(--vp-c-black) 40%, transparent);
  position: relative;
  transform-origin: top left;
  transition:
    opacity 220ms ease,
    transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.fey-cards::before {
  position: absolute;
  right: 4px;
  bottom: -7px;
  left: 3px;
  height: 9px;
  border-radius: 50%;
  background: radial-gradient(ellipse, color-mix(in srgb, var(--vp-c-black) 48%, transparent), transparent 72%);
  content: '';
  filter: blur(4px);
  opacity: 0.7;
  pointer-events: none;
  transform: skewX(-14deg);
}

.fey-cards:hover,
.fey-cards:focus-within {
  transform: translateY(-6px) scale(1.75);
}

.fey-card {
  position: absolute;
  inset: 0 auto auto 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transform-style: preserve-3d;
}

.fey-card:focus-visible {
  outline: 2px solid var(--fey-card-focus);
  outline-offset: 3px;
}

.fey-card-surface {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
  border: 1px solid var(--fey-card-border);
  border-radius: 8px;
  background: var(--fey-card-bg);
  backdrop-filter: blur(10px);
  box-shadow: -2px 6px 16px var(--fey-card-shadow);
  transform: perspective(1200px) rotateX(20deg) rotateY(-12deg);
  transform-style: preserve-3d;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.fey-card-surface::after {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(115deg, var(--fey-card-highlight), transparent 34%);
  box-shadow:
    inset 1px 1px 0 color-mix(in srgb, var(--vp-c-white) 24%, transparent),
    inset -1px -1px 0 color-mix(in srgb, var(--vp-c-black) 16%, transparent);
  content: '';
  pointer-events: none;
}

.fey-card.is-active .fey-card-surface {
  border-color: var(--fey-card-border-active);
  box-shadow: 0 8px 20px var(--fey-card-shadow-active);
}

.fey-card-image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 7px;
  object-fit: cover;
}

@media (prefers-reduced-motion: reduce) {
  .fey-cards,
  .fey-card-surface {
    transition: none;
  }
}
</style>
