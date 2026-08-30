import { createGlobalState, useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { matchLanguages } from '@/composables/matchLanguages'
import { useLanguage } from '@/composables/useLanguage'
import supportedLanguages from '~/_data/supportedLanguages.json'

export const useForumTranslationPreferences = createGlobalState(() => {
  const { currentPageLang } = useLanguage()
  const autoTranslateEnabled = useLocalStorage('forum-auto-translate-enabled', true)
  const browserLanguage = import.meta.env.SSR
    ? null
    : matchLanguages(supportedLanguages, [navigator.languages[0]])
  const targetLanguage = computed(() => browserLanguage ?? currentPageLang.value)

  return {
    autoTranslateEnabled,
    targetLanguage,
  }
})
