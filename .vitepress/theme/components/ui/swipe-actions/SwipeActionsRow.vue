<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { SwipeAction, SwipeSide } from './types'
import { LoaderCircle, MoreHorizontal } from '@lucide/vue'
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { stepSpring } from '@/hooks/fluid-hover/spring'
import { cn } from '@/lib/utils'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { ACTION_WIDTH, constrainSwipe, fullSwipeThreshold, resolveSwipeRelease, SWIPE_SLOP, swipeSide, swipeVelocity } from './gesture'
import { swipeActionsKey } from './types'

const props = withDefaults(defineProps<{
  label: string
  /** Localized accessible name for the More actions button. */
  menuLabel: string
  leading?: SwipeAction[]
  trailing?: SwipeAction[]
  fullSwipe?: boolean
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), { leading: () => [], trailing: () => [], fullSwipe: true, disabled: false })
const emit = defineEmits<{
  select: [action: SwipeAction, side: SwipeSide]
  actionError: [error: unknown, action: SwipeAction]
}>()
const context = inject(swipeActionsKey)
if (!context)
  throw new Error('SwipeActionsRow must be inside SwipeActions')
const group = context
const id = useId()
const row = ref<HTMLElement>()
const content = ref<HTMLElement>()
const menuOpen = ref(false)
const pending = ref(false)
const { reducedMotion } = useSitePreferences()
const sides = ['leading', 'trailing'] as const
const menuItems = computed(() => sides.flatMap(side => props[side].map(action => ({ side, action }))))
let width = 320
let x = 0
let armedSide: SwipeSide | null = null
const committingAction = ref<{ side: SwipeSide, id: string } | null>(null)
let frame = 0
let observer: ResizeObserver | undefined
let mounted = false
let swallowClick = false
let focusAfterRemoval = false
let drag: { pointer: number, startX: number, startY: number, origin: number, axis: 'x' | 'y' | null, samples: [number, number][] } | null = null
let finishTravel: (() => void) | undefined

function outerAction(side: SwipeSide) {
  return side === 'leading' ? props.leading[0] : props.trailing.at(-1)
}

function canCommit(side: SwipeSide) {
  return props.fullSwipe && !!outerAction(side) && !outerAction(side)?.disabled
}

// Pointer frames update transforms directly, without rerendering the row's slot.
function paint(value: number) {
  x = value
  if (!content.value || !row.value)
    return
  content.value.style.transform = `translate3d(${x}px, 0, 0)`
  for (const side of sides) {
    const buttons = row.value.querySelectorAll<HTMLElement>(`[data-swipe-side="${side}"]`)
    const direction = side === 'leading' ? 1 : -1
    const revealed = Math.max(0, x * direction)
    const share = revealed / Math.max(1, buttons.length)
    const coverId = committingAction.value?.side === side
      ? committingAction.value.id
      : armedSide === side ? outerAction(side)?.id : undefined
    buttons.forEach((button, index) => {
      const covering = coverId !== undefined && props[side][index]?.id === coverId
      const offset = side === 'leading' ? index : buttons.length - 1 - index
      button.style.width = `${covering ? Math.min(revealed, width) : share}px`
      button.style[side === 'leading' ? 'left' : 'right'] = `${covering ? 0 : offset * share}px`
      button.style.zIndex = covering ? '2' : '1'
      button.style.visibility = revealed > 0 && (coverId === undefined || covering) ? 'visible' : 'hidden'
      button.dataset.covering = String(covering)
      const reveal = covering ? 1 : Math.min(1, Math.max(0, (share - 20) / 40))
      button.style.setProperty('--swipe-reveal', String(reveal))
      button.style.setProperty('--swipe-icon-scale', String(0.8 + reveal * 0.2))
    })
  }
}

function stopTravel() {
  cancelAnimationFrame(frame)
  frame = 0
  finishTravel?.()
  finishTravel = undefined
}

function travel(target: number, velocity = 0): Promise<void> {
  stopTravel()
  if (reducedMotion.value) {
    paint(target)
    return Promise.resolve()
  }
  const pos = new Float64Array([x])
  const vel = new Float64Array([velocity])
  const end = new Float64Array([target])
  let previous = performance.now()
  return new Promise((resolve) => {
    finishTravel = resolve
    const tick = (now: number) => {
      const settled = stepSpring(pos, vel, end, 0.38, Math.min((now - previous) / 1000, 0.064))
      previous = now
      paint(pos[0]!)
      if (settled) {
        frame = 0
        finishTravel = undefined
        resolve()
      }
      else {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
  })
}

function settle(target = 0, velocity = 0) {
  armedSide = null
  if (target)
    group.openId.value = id
  else if (group.openId.value === id)
    group.openId.value = null
  // Cap inward momentum so opposite-side actions cannot flash while returning home.
  const launch = target === 0 && Math.sign(velocity) === -Math.sign(x)
    ? Math.sign(velocity) * Math.min(Math.abs(velocity), Math.abs(x) * 12)
    : velocity
  return travel(target, launch)
}

async function select(action: SwipeAction, side: SwipeSide, fromMenu = false) {
  if (props.disabled || pending.value || action.disabled)
    return
  pending.value = true
  committingAction.value = { side, id: action.id }
  paint(x)
  focusAfterRemoval = fromMenu
  if (group.openId.value === id)
    group.openId.value = null
  try {
    if (!action.keepRow) {
      armedSide = side
      await travel((side === 'leading' ? 1 : -1) * (width + 2))
    }
    if (!mounted)
      return
    await action.onSelect()
    emit('select', action, side)
  }
  catch (error) {
    emit('actionError', error, action)
  }
  finally {
    await nextTick()
    if (mounted) {
      focusAfterRemoval = false
      await settle()
      committingAction.value = null
      if (mounted) {
        pending.value = false
        paint(x)
        if (fromMenu && (document.activeElement === document.body || row.value?.contains(document.activeElement)))
          row.value?.querySelector<HTMLElement>('[data-swipe-more]')?.focus({ preventScroll: true })
      }
    }
  }
}

function pointerDown(event: PointerEvent) {
  swallowClick = false
  if (props.disabled || pending.value || menuOpen.value || !event.isPrimary || event.button !== 0)
    return
  // Keep text fields, links and other slotted controls usable.
  if ((event.target as Element).closest('a, input, textarea, select, button, [contenteditable="true"]'))
    return
  stopTravel()
  drag = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, origin: x, axis: null, samples: [[event.timeStamp, event.clientX]] }
}

function pointerMove(event: PointerEvent) {
  if (!drag || drag.pointer !== event.pointerId || drag.axis === 'y')
    return
  const dx = event.clientX - drag.startX
  const dy = event.clientY - drag.startY
  if (!drag.axis) {
    if (Math.hypot(dx, dy) < SWIPE_SLOP)
      return
    if (Math.abs(dy) > Math.abs(dx)) {
      drag.axis = 'y'
      return
    }
    drag.axis = 'x'
    content.value?.setPointerCapture(event.pointerId)
    row.value?.setAttribute('data-dragging', '')
    group.openId.value = id
  }
  const side = swipeSide(drag.origin + dx)
  const count = side ? props[side].length : 0
  const value = constrainSwipe(drag.origin + dx, count, width, !!side && canCommit(side))
  const threshold = fullSwipeThreshold(Math.min(count * ACTION_WIDTH, width), width)
  armedSide = side && canCommit(side) && Math.abs(value) > threshold - (armedSide === side ? 20 : 0) ? side : null
  paint(value)
  drag.samples.push([event.timeStamp, event.clientX])
  if (drag.samples.length > 12)
    drag.samples.shift()
}

function pointerEnd(event: PointerEvent) {
  if (!drag || drag.pointer !== event.pointerId)
    return
  const current = drag
  drag = null
  row.value?.removeAttribute('data-dragging')
  if (content.value?.hasPointerCapture(event.pointerId))
    content.value.releasePointerCapture(event.pointerId)
  if (current.axis === 'x') {
    swallowClick = true
    current.samples.push([event.timeStamp, event.clientX])
    const side = swipeSide(x)
    const result = resolveSwipeRelease({
      value: x,
      velocity: swipeVelocity(current.samples),
      count: side ? props[side].length : 0,
      width,
      fullSwipe: !!side && canCommit(side),
      armed: armedSide === side,
      cancelled: event.type !== 'pointerup',
    })
    if (result.commit && side)
      void select(outerAction(side)!, side)
    else
      void settle(result.target, event.type === 'pointerup' ? swipeVelocity(current.samples) : 0)
  }
  else if (current.axis === null && x && event.type === 'pointerup') {
    swallowClick = true
    void settle()
  }
}

function clickCapture(event: MouseEvent) {
  if (swallowClick && event.detail > 0) {
    swallowClick = false
    event.preventDefault()
    event.stopPropagation()
  }
}

function lostPointerCapture(event: PointerEvent) {
  // Ignore a child's implicit touch capture being transferred to this container.
  if (event.target === content.value)
    pointerEnd(event)
}

watch(() => group.openId.value, (openId) => {
  if (openId !== id && !pending.value) {
    drag = null
    row.value?.removeAttribute('data-dragging')
    void settle()
  }
})
// Parent renders often recreate callbacks and labels; only gesture capabilities
// should interrupt a drag, and never interrupt an action already in progress.
watch(() => JSON.stringify([
  props.disabled,
  props.fullSwipe,
  props.leading.map(action => [action.id, !!action.disabled]),
  props.trailing.map(action => [action.id, !!action.disabled]),
]), () => {
  if (pending.value)
    return
  drag = null
  row.value?.removeAttribute('data-dragging')
  void settle()
})
watch(reducedMotion, () => {
  if (reducedMotion.value && !pending.value)
    void settle(group.openId.value === id ? Math.sign(x) * Math.min((swipeSide(x) ? props[swipeSide(x)!].length : 0) * ACTION_WIDTH, width) : 0)
})

onMounted(() => {
  mounted = true
  group.rows.set(id, row.value!)
  width = row.value!.getBoundingClientRect().width
  observer = new ResizeObserver(([entry]) => {
    width = entry!.contentRect.width
    if (!drag && !pending.value && x)
      void settle(Math.sign(x) * Math.min(props[swipeSide(x)!].length * ACTION_WIDTH, width))
  })
  observer.observe(row.value!)
})
onBeforeUnmount(() => {
  mounted = false
  stopTravel()
  observer?.disconnect()
  const el = row.value
  if (el && (focusAfterRemoval || el.contains(document.activeElement))) {
    const siblings = [...el.parentElement!.children].filter(node => node !== el && !node.hasAttribute('data-removing'))
    const next = siblings.find(node => !!(el.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)) ?? siblings.at(-1)
    const target = next?.querySelector<HTMLElement>('[data-swipe-more]') ?? group.list.value
    target?.focus({ preventScroll: true })
  }
  el?.setAttribute('data-removing', '')
  group.rows.delete(id)
  if (group.openId.value === id)
    group.openId.value = null
})
</script>

<template>
  <li ref="row" :class="cn('swipe-actions-row', props.class)" data-slot="swipe-actions-row" :aria-label="label" :aria-busy="pending">
    <template v-for="side in sides" :key="side">
      <button
        v-for="action in props[side]"
        :key="action.id"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="swipe-action"
        :data-swipe-side="side"
        :data-tone="action.tone ?? 'neutral'"
        :disabled="disabled || pending || action.disabled"
        @click="select(action, side)"
      >
        <span class="swipe-action-glyph">
          <LoaderCircle v-if="pending && committingAction?.side === side && committingAction.id === action.id" :size="20" class="animate-spin" />
          <component :is="action.icon" v-else-if="action.icon" :size="20" />
          <span>{{ action.label }}</span>
        </span>
      </button>
    </template>
    <div
      ref="content"
      class="swipe-actions-content"
      @pointerdown="pointerDown"
      @pointermove="pointerMove"
      @pointerup="pointerEnd"
      @pointercancel="pointerEnd"
      @lostpointercapture="lostPointerCapture"
      @click.capture="clickCapture"
      @dragstart.prevent
    >
      <div class="swipe-actions-body">
        <slot />
      </div>
      <DropdownMenu v-if="menuItems.length" v-model:open="menuOpen" @update:open="$event && settle()">
        <DropdownMenuTrigger as-child>
          <Button type="button" variant="ghost" size="icon" data-swipe-more :aria-label="menuLabel" :disabled="disabled || pending">
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" :loop="true" @close-auto-focus="focusAfterRemoval && $event.preventDefault()">
          <DropdownMenuGroup>
            <DropdownMenuItem
              v-for="{ action, side } in menuItems"
              :key="`${side}-${action.id}`"
              :disabled="disabled || pending || action.disabled"
              :variant="action.tone === 'danger' ? 'destructive' : 'default'"
              @select="select(action, side, true)"
            >
              <component :is="action.icon" v-if="action.icon" aria-hidden="true" />
              {{ action.label }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </li>
</template>

<style scoped>
.swipe-actions-row {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}
.swipe-actions-content {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 64px;
  padding: 0.75rem 0.5rem 0.75rem 1rem;
  background: oklch(var(--background));
  touch-action: pan-y pinch-zoom;
}
.swipe-actions-row:not(:last-child) .swipe-actions-content {
  border-bottom: 1px solid oklch(var(--border));
}
.swipe-actions-row[data-dragging] .swipe-actions-content {
  user-select: none;
  cursor: grabbing;
}
.swipe-actions-body {
  flex: 1;
  min-width: 0;
}
.swipe-action {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  visibility: hidden;
  overflow: hidden;
  border: 0;
  padding: 0;
  cursor: pointer;
  background: oklch(var(--secondary));
  color: oklch(var(--secondary-foreground));
}
.swipe-action[data-tone='accent'] {
  background: oklch(var(--primary));
  color: oklch(var(--primary-foreground));
}
.swipe-action[data-tone='danger'] {
  background: oklch(var(--destructive));
  color: oklch(var(--destructive-foreground));
}
.swipe-action:disabled {
  cursor: default;
}
.swipe-action:disabled:not([data-covering='true']) {
  opacity: 0.5;
}
.swipe-action-glyph {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 76px;
  height: 100%;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: var(--swipe-reveal, 0);
}
.swipe-action-glyph > svg:not(.animate-spin) {
  transform: scale(var(--swipe-icon-scale, 1));
}
.swipe-action[data-covering='true'] .swipe-action-glyph {
  min-width: 0;
}
</style>
