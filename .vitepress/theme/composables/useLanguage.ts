import { useData } from 'vitepress'
import { computed } from 'vue'
import { getLangPath } from '@/utils'
import { matchLanguages } from './matchLanguages'

const DEFAULT_LANG = 'zh'
const TRIM_PATH_SLASHES_RE = /^\/+|\/+$/g

export function useLanguage(supportedLanguages: string[] = ['zh', 'en', 'ja'], defaultLang = DEFAULT_LANG) {
  const { localeIndex } = useData()

  const currentPageLang = computed(() => {
    const path = getLangPath(localeIndex.value).replace(TRIM_PATH_SLASHES_RE, '')
    return path || DEFAULT_LANG
  })
  const matchedLang = matchLanguages(supportedLanguages, import.meta.env.SSR ? [defaultLang] : navigator?.languages) || defaultLang

  return {
    currentPageLang,
    matchedLang,
  }
}
