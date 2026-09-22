import type { ToasterProps } from 'vue-sonner'
import { createGlobalState, useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'auto'
export type ToastPosition = NonNullable<ToasterProps['position']>

const THEME_STORAGE_KEY = 'vitepress-theme-appearance'
const TOAST_POSITION_STORAGE_KEY = 'site-toast-position'
const TOAST_DURATION_STORAGE_KEY = 'site-toast-duration'

export const TOAST_DURATION_VALUES = [2500, 4000, 8000, Number.POSITIVE_INFINITY] as const
export const DEFAULT_TOAST_DURATION = 4000

const toastPositions: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

export const useSitePreferences = createGlobalState(() => {
  const storedTheme = useLocalStorage<ThemePreference>(THEME_STORAGE_KEY, 'auto')
  const storedToastPosition = useLocalStorage<ToastPosition>(TOAST_POSITION_STORAGE_KEY, 'bottom-right')
  const storedToastDuration = useLocalStorage<number | 'persistent'>(TOAST_DURATION_STORAGE_KEY, DEFAULT_TOAST_DURATION)

  const theme = computed<ThemePreference>({
    get: () => ['light', 'dark', 'auto'].includes(storedTheme.value) ? storedTheme.value : 'auto',
    set: value => storedTheme.value = value,
  })
  const toastPosition = computed<ToastPosition>({
    get: () => toastPositions.includes(storedToastPosition.value) ? storedToastPosition.value : 'bottom-right',
    set: value => storedToastPosition.value = value,
  })
  const toastDuration = computed<number>({
    get: () => storedToastDuration.value === 'persistent'
      ? Number.POSITIVE_INFINITY
      : Math.max(TOAST_DURATION_VALUES[0], Number(storedToastDuration.value) || DEFAULT_TOAST_DURATION),
    set: value => storedToastDuration.value = Number.isFinite(value)
      ? Math.max(TOAST_DURATION_VALUES[0], value)
      : 'persistent',
  })

  return {
    theme,
    toastPosition,
    toastDuration,
    toastPositions,
  }
})
