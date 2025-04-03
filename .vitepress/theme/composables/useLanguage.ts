import { equalLangCode, getLangPath } from '@/utils'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { matchLanguages } from './matchLanguages'

const DEFAULT_LANG = 'zh'

export function useLanguage(supportedLanguages: string[] = ['zh', 'en', 'ja'], defaultLang = DEFAULT_LANG) {
  const { localeIndex } = useData()

  const currentPageLang = computed(() => getLangPath(localeIndex.value).replace('/', DEFAULT_LANG))
  const matchedLang = matchLanguages(supportedLanguages, import.meta.env.SSR ? [defaultLang] : navigator?.languages) || defaultLang
  const isNoTranslationRequirement = computed(() => equalLangCode(matchedLang, currentPageLang.value))

  return {
    currentPageLang,
    isNoTranslationRequirement,
    matchedLang,
  }
}
