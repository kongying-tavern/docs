<script setup lang="ts">
import type { ActiveForumFestival, ForumFestivalEffectController } from '~/forum/services/forumFestival'
import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import { useData } from 'vitepress'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { forumFestivals } from '~/config/forumFestivals'
import {
  FESTIVAL_AUTOPLAYED_STORAGE_KEY,
  FESTIVAL_DISMISSALS_STORAGE_KEY,
  formatFestivalDate,
  normalizeOccurrenceList,
  pruneOccurrenceList,
  resolveActiveForumFestival,
  resolveForumFestivalAutoStart,
} from '~/forum/services/forumFestival'

const { localeIndex } = useData()
const { message } = useLocalized()
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const dismissedStorage = useLocalStorage<unknown>(FESTIVAL_DISMISSALS_STORAGE_KEY, [])
const autoplayedStorage = useLocalStorage<unknown>(FESTIVAL_AUTOPLAYED_STORAGE_KEY, [])
const dismissedOccurrences = computed(() => normalizeOccurrenceList(dismissedStorage.value))
const autoplayedOccurrences = computed(() => normalizeOccurrenceList(autoplayedStorage.value))
const failedOccurrences = ref<string[]>([])
const unavailableOccurrences = computed(() => [
  ...dismissedOccurrences.value,
  ...failedOccurrences.value,
])
const mounted = ref(false)
const now = ref(Date.now())
const enteredAt = now.value
const loading = ref(false)
const running = ref(false)
const loadingOccurrence = ref('')

let currentEffect: ForumFestivalEffectController | null = null
let currentOccurrence = ''
let runToken = 0
let clockTimer = 0
let autoStartTimer = 0

const visibleFestivals = computed<ActiveForumFestival[]>(() => {
  if (!mounted.value || reducedMotion.value)
    return []

  const active = resolveActiveForumFestival({
    festivals: forumFestivals,
    now: now.value,
    locale: localeIndex.value,
    dismissedOccurrences: unavailableOccurrences.value,
  })
  return active ? [active] : []
})

function festivalLabel(festival: ActiveForumFestival): string {
  return message.value.forum.sidebar.festival[festival.definition.labelKey]
}

function storeOccurrence(storage: typeof dismissedStorage, occurrence: string): void {
  const year = Number(formatFestivalDate(Date.now()).slice(0, 4))
  storage.value = pruneOccurrenceList(
    [...normalizeOccurrenceList(storage.value), occurrence],
    year,
  )
}

function stopCurrentEffect(fadeOut = false): void {
  runToken += 1
  currentEffect?.stop({ fadeOut })
  currentEffect = null
  currentOccurrence = ''
  loading.value = false
  loadingOccurrence.value = ''
  running.value = false
}

function isStillEligible(festival: ActiveForumFestival): boolean {
  if (reducedMotion.value || document.hidden)
    return false

  const active = resolveActiveForumFestival({
    festivals: forumFestivals,
    now: Date.now(),
    locale: localeIndex.value,
    dismissedOccurrences: unavailableOccurrences.value,
  })
  return active?.window.occurrence === festival.window.occurrence
}

async function playFestival(festival: ActiveForumFestival, automatic = false): Promise<void> {
  if (!isStillEligible(festival))
    return

  if (running.value && currentOccurrence === festival.window.occurrence) {
    stopCurrentEffect(true)
    return
  }

  stopCurrentEffect()
  const token = ++runToken
  loading.value = true
  loadingOccurrence.value = festival.window.occurrence
  try {
    const effectModule = await festival.definition.loadEffect()
    if (token !== runToken || !isStillEligible(festival))
      return

    const controller = effectModule.startFestivalEffect({
      durationMs: festival.definition.durationMs,
      ...festival.definition.effectOptions,
    })
    currentEffect = controller
    currentOccurrence = festival.window.occurrence
    running.value = true
    if (automatic)
      storeOccurrence(autoplayedStorage, festival.window.occurrence)

    void controller.finished.then(() => {
      if (currentEffect !== controller)
        return
      currentEffect = null
      currentOccurrence = ''
      running.value = false
    })
  }
  catch {
    if (token === runToken && !failedOccurrences.value.includes(festival.window.occurrence)) {
      failedOccurrences.value = [
        ...failedOccurrences.value,
        festival.window.occurrence,
      ]
    }
  }
  finally {
    if (token === runToken) {
      loading.value = false
      loadingOccurrence.value = ''
    }
  }
}

function dismiss(festival: ActiveForumFestival): void {
  storeOccurrence(dismissedStorage, festival.window.occurrence)
  stopCurrentEffect()
  clearTimeout(autoStartTimer)
}

function runScheduledAutoStart(festival: ActiveForumFestival): void {
  now.value = Date.now()
  if (document.hidden || !isStillEligible(festival))
    return
  void playFestival(festival, true)
}

function scheduleAutoStart(): void {
  clearTimeout(autoStartTimer)
  if (!mounted.value || reducedMotion.value)
    return

  const candidate = resolveForumFestivalAutoStart({
    festivals: forumFestivals,
    enteredAt,
    now: Date.now(),
    locale: localeIndex.value,
    dismissedOccurrences: unavailableOccurrences.value,
    autoplayedOccurrences: autoplayedOccurrences.value,
  })
  if (!candidate)
    return

  if (candidate.delayMs === 0) {
    runScheduledAutoStart(candidate)
    return
  }

  autoStartTimer = window.setTimeout(
    runScheduledAutoStart,
    candidate.delayMs,
    candidate,
  )
}

function handleVisibilityChange(): void {
  if (document.hidden) {
    stopCurrentEffect()
    clearTimeout(autoStartTimer)
  }
}

onMounted(() => {
  mounted.value = true
  now.value = Date.now()
  clockTimer = window.setInterval(() => now.value = Date.now(), 30_000)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  scheduleAutoStart()
})

watch([localeIndex, reducedMotion, unavailableOccurrences, autoplayedOccurrences], () => {
  if (currentOccurrence && !visibleFestivals.value.some(festival => festival.window.occurrence === currentOccurrence))
    stopCurrentEffect()
  scheduleAutoStart()
})

onBeforeUnmount(() => {
  stopCurrentEffect()
  clearInterval(clockTimer)
  clearTimeout(autoStartTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div
    v-for="festival in visibleFestivals"
    :key="festival.window.occurrence"
    class="forum-sidebar-festival"
  >
    <button
      type="button"
      class="forum-sidebar-festival-action"
      :disabled="loadingOccurrence === festival.window.occurrence"
      :aria-busy="loadingOccurrence === festival.window.occurrence || undefined"
      :aria-pressed="running && currentOccurrence === festival.window.occurrence"
      @click="playFestival(festival)"
    >
      <span
        class="forum-sidebar-festival-icon icon-btn"
        :class="festival.definition.icon"
        aria-hidden="true"
      />
      <span class="flex-1 min-w-0 truncate">{{ festivalLabel(festival) }}</span>
      <span
        v-if="loadingOccurrence === festival.window.occurrence"
        class="i-lucide-loader-circle icon-btn size-4 animate-spin"
        aria-hidden="true"
      />
      <span
        v-else-if="running && currentOccurrence === festival.window.occurrence"
        class="i-lucide-sparkles icon-btn size-4"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      class="forum-sidebar-festival-close"
      :aria-label="message.forum.sidebar.festival.dismiss"
      :title="message.forum.sidebar.festival.dismiss"
      @click.stop="dismiss(festival)"
    >
      <span class="i-lucide-x icon-btn size-4" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.forum-sidebar-festival {
  position: relative;
  z-index: 11;
  display: flex;
  align-items: center;
  gap: 0;
  border-radius: 8px;
  margin-top: 4px;
  background: transparent;
  transition:
    background-color 150ms,
    color 150ms;
}

.forum-sidebar-festival-action,
.forum-sidebar-festival-close {
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  font-family: inherit;
  cursor: pointer;
  transition:
    background-color 150ms,
    color 150ms,
    opacity 150ms;
}

.forum-sidebar-festival-action {
  display: flex;
  height: 36px;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  font-size: calc(12px * var(--site-ui-scale, 1));
  line-height: calc(16px * var(--site-ui-scale, 1));
  text-align: left;
}

.forum-sidebar-festival-action:disabled {
  cursor: wait;
}

.forum-sidebar-festival-close {
  display: grid;
  width: 28px;
  height: 36px;
  flex: 0 0 28px;
  place-items: center;
  opacity: 0;
  pointer-events: none;
}

.forum-sidebar-festival:hover .forum-sidebar-festival-close,
.forum-sidebar-festival:focus-within .forum-sidebar-festival-close {
  opacity: 1;
  pointer-events: auto;
}

.forum-sidebar-festival:hover,
.forum-sidebar-festival:focus-within {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.forum-sidebar-festival:focus-within {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.forum-sidebar-festival-close:hover,
.forum-sidebar-festival-close:focus-visible {
  color: var(--vp-c-danger-1);
}

.forum-sidebar-festival-action:active,
.forum-sidebar-festival-close:active {
  scale: 0.96;
}

.forum-sidebar-festival-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  color: inherit;
  background-color: currentcolor !important;
}

@media (hover: none) {
  .forum-sidebar-festival-close {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
