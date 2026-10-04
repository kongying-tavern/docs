<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { cn } from '@/lib/utils'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { swipeActionsKey } from './types'

const props = defineProps<{ label: string, class?: HTMLAttributes['class'] }>()
const list = ref<HTMLElement>()
const openId = ref<string | null>(null)
const rows = new Map<string, HTMLElement>()
const { reducedMotion } = useSitePreferences()
const animations = new Map<Element, Animation>()
provide(swipeActionsKey, { openId, rows, list })

function closeOutside(event: PointerEvent) {
  const row = openId.value ? rows.get(openId.value) : undefined
  if (row && event.target instanceof Node && row.contains(event.target))
    return
  openId.value = null
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape')
    openId.value = null
}

function transition(element: Element, done: () => void, leaving = false) {
  const el = element as HTMLElement
  animations.get(element)?.cancel()
  const height = `${el.getBoundingClientRect().height}px`
  const from = { height: '0px', opacity: 0 }
  const to = { height, opacity: 1 }
  const frames = reducedMotion.value
    ? (leaving ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }])
    : leaving ? [to, from] : [from, to]
  const animation = el.animate(frames, {
    duration: reducedMotion.value ? 100 : 240,
    easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
  })
  animations.set(element, animation)
  animation.onfinish = () => {
    animations.delete(element)
    done()
  }
}

function cancelTransition(element: Element) {
  animations.get(element)?.cancel()
  animations.delete(element)
}

onMounted(() => {
  document.addEventListener('pointerdown', closeOutside, true)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeOutside, true)
  document.removeEventListener('keydown', onKeydown)
  animations.forEach(animation => animation.cancel())
})
</script>

<template>
  <div :class="cn('swipe-actions-surface rounded-xl border bg-background', props.class)" data-slot="swipe-actions">
    <ul
      ref="list"
      role="list"
      :aria-label="label"
      :tabindex="-1"
      class="swipe-actions-list"
    >
      <TransitionGroup
        :css="false"
        @enter="transition"
        @leave="(el, done) => transition(el, done, true)"
        @enter-cancelled="cancelTransition"
        @leave-cancelled="cancelTransition"
      >
        <slot />
      </TransitionGroup>
    </ul>
  </div>
</template>

<style scoped>
.swipe-actions-surface {
  overflow: hidden;
}
.swipe-actions-surface:has(> ul:empty) {
  border-color: transparent;
  background: transparent;
}
.swipe-actions-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.swipe-actions-list:empty {
  min-height: 1px;
}
</style>
