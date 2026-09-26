import type { MotionPreference, ThemePreference, ToastPosition } from '~/config/settingsOptions'
import { createGlobalState, useLocalStorage, useMediaQuery } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import {
  DEFAULT_TOAST_DURATION,
  isThemePreference,
  isToastPosition,
  TOAST_DURATION_DEFINITIONS,
} from '~/config/settingsOptions'
import {
  applySitePreferences,
  DEFAULT_UI_FONT_SIZE,
  DESKTOP_UI_MEDIA_QUERY,
  MOTION_STORAGE_KEY,
  normalizeUiFontSize,
  POINTER_CURSOR_STORAGE_KEY,
  resolveReducedMotion,
  UI_FONT_SIZE_STORAGE_KEY,
} from '~/services/sitePreferences'

export type { ThemePreference, ToastPosition } from '~/config/settingsOptions'

const THEME_STORAGE_KEY = 'vitepress-theme-appearance'
const TOAST_POSITION_STORAGE_KEY = 'site-toast-position'
const TOAST_DURATION_STORAGE_KEY = 'site-toast-duration'

const minimumToastDuration = TOAST_DURATION_DEFINITIONS[0].value

export const useSitePreferences = createGlobalState(() => {
  const storedTheme = useLocalStorage<ThemePreference>(THEME_STORAGE_KEY, 'auto')
  const storedToastPosition = useLocalStorage<ToastPosition>(TOAST_POSITION_STORAGE_KEY, 'bottom-right')
  const storedToastDuration = useLocalStorage<number | 'persistent'>(TOAST_DURATION_STORAGE_KEY, DEFAULT_TOAST_DURATION)
  const storedUsePointerCursor = useLocalStorage(POINTER_CURSOR_STORAGE_KEY, false)
  const storedMotion = useLocalStorage<MotionPreference>(MOTION_STORAGE_KEY, 'system')
  const storedUiFontSize = useLocalStorage(UI_FONT_SIZE_STORAGE_KEY, DEFAULT_UI_FONT_SIZE)
  const systemReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const desktopUi = useMediaQuery(DESKTOP_UI_MEDIA_QUERY)

  const theme = computed<ThemePreference>({
    get: () => isThemePreference(storedTheme.value) ? storedTheme.value : 'auto',
    set: value => storedTheme.value = value,
  })
  const toastPosition = computed<ToastPosition>({
    get: () => isToastPosition(storedToastPosition.value) ? storedToastPosition.value : 'bottom-right',
    set: value => storedToastPosition.value = value,
  })
  const toastDuration = computed<number>({
    get: () => storedToastDuration.value === 'persistent'
      ? Number.POSITIVE_INFINITY
      : Math.max(minimumToastDuration, Number(storedToastDuration.value) || DEFAULT_TOAST_DURATION),
    set: value => storedToastDuration.value = Number.isFinite(value)
      ? Math.max(minimumToastDuration, value)
      : 'persistent',
  })
  const usePointerCursor = computed({
    get: () => storedUsePointerCursor.value === true,
    set: value => storedUsePointerCursor.value = value,
  })
  const motionPreference = computed<MotionPreference>({
    get: () => storedMotion.value === 'reduce' || storedMotion.value === 'no-preference'
      ? storedMotion.value
      : 'system',
    set: value => storedMotion.value = value,
  })
  const reducedMotion = computed(() => resolveReducedMotion(motionPreference.value, systemReducedMotion.value))
  const uiFontSize = computed({
    get: () => normalizeUiFontSize(storedUiFontSize.value),
    set: value => storedUiFontSize.value = normalizeUiFontSize(value),
  })

  watchEffect(() => {
    if (typeof document === 'undefined')
      return
    applySitePreferences(document.documentElement, {
      usePointerCursor: usePointerCursor.value,
      reducedMotion: reducedMotion.value,
      uiFontSize: uiFontSize.value,
      desktop: desktopUi.value,
    })
  })

  return {
    theme,
    usePointerCursor,
    motionPreference,
    reducedMotion,
    uiFontSize,
    desktopUi,
    toastPosition,
    toastDuration,
  }
})
