import type { ThemePreference } from '~/composables/useSitePreferences'
import { useData } from 'vitepress'
import { nextTick } from 'vue'
import { enableTransitions } from '@/shared'
import { useSitePreferences } from '~/composables/useSitePreferences'

let isAnimating = false

export function useThemeTransition() {
  const { isDark } = useData()
  const { theme } = useSitePreferences()

  async function setTheme(value: ThemePreference): Promise<void> {
    if (isAnimating)
      return

    const nextIsDark = value === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : value === 'dark'
    const applyTheme = async () => {
      isDark.value = nextIsDark
      // VitePress 会把与系统一致的主题写成 auto；等其同步后再保存明确选择。
      await nextTick()
      theme.value = value
      await nextTick()
    }

    if (nextIsDark === isDark.value || !enableTransitions()) {
      await applyTheme()
      return
    }

    isAnimating = true
    const root = document.documentElement
    root.dataset.themeTransition = ''

    try {
      let transition: ViewTransition
      try {
        transition = document.startViewTransition(applyTheme)
      }
      catch {
        await applyTheme()
        return
      }

      void transition.ready.catch(() => {})
      await transition.finished.catch(() => {})
    }
    finally {
      delete root.dataset.themeTransition
      isAnimating = false
    }
  }

  return {
    setTheme,
    toggleTheme: () => setTheme(isDark.value ? 'light' : 'dark'),
  }
}
