import { useData } from 'vitepress'
import { computed } from 'vue'
import { getLangPath } from '@/utils'
import { DEFAULT_LOCALE } from '../../locales/common/site'
import { matchLanguages } from './matchLanguages'

const TRIM_PATH_SLASHES_RE = /^\/+|\/+$/g

export function useLanguage(supportedLanguages: string[] = [], defaultLang = DEFAULT_LOCALE) {
  const { localeIndex, site } = useData()

  const languages = supportedLanguages.length > 0
    ? supportedLanguages
    : Object.values(site.value.locales).map(locale => locale.lang ?? '')

  const currentPageLang = computed(() => {
    const path = getLangPath(localeIndex.value).replace(TRIM_PATH_SLASHES_RE, '')
    return path || DEFAULT_LOCALE
  })
  const matchedLang = matchLanguages(languages, import.meta.env.SSR ? [defaultLang] : navigator?.languages) || defaultLang

  return {
    currentPageLang,
    matchedLang,
  }
}
