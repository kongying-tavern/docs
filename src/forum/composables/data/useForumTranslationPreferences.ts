import { useLanguage } from '@theme/hooks/useLanguage.ts'
import { createGlobalState, useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import supportedLanguages from '#data/static/common/supported-languages.json'
import { matchLanguages } from '@/src/forum/composables/data/matchLanguages.ts'

export const useForumTranslationPreferences = createGlobalState(() => {
  const { currentPageLang } = useLanguage()
  const autoTranslateEnabled = useLocalStorage('forum-auto-translate-enabled', true)
  const storedExcludedSourceLanguages = useLocalStorage<string[]>('forum-auto-translate-excluded-source-languages', [])
  const supportedLanguageSet = new Set<string>(supportedLanguages)
  const excludedSourceLanguages = computed<string[]>({
    get: () => [...new Set(storedExcludedSourceLanguages.value.filter(language => supportedLanguageSet.has(language)))],
    set: languages => storedExcludedSourceLanguages.value = [
      ...new Set(languages.filter(language => supportedLanguageSet.has(language))),
    ],
  })
  const browserLanguage = import.meta.env.SSR
    ? null
    : matchLanguages(supportedLanguages, [navigator.languages[0]])
  const targetLanguage = computed(() => browserLanguage ?? currentPageLang.value)

  return {
    autoTranslateEnabled,
    excludedSourceLanguages,
    targetLanguage,
  }
})
