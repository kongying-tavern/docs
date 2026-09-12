import { useData } from 'vitepress'
import { computed } from 'vue'
import { DEFAULT_LOCALE } from '../../../locales/common/site'

export const STORE_KEY = 'BANNER'
export const DEFAULT_LOCALE_CODE = DEFAULT_LOCALE

export function useLocaleConfig() {
  const { site } = useData()
  return computed(() =>
    Object.entries(site.value.locales).map(([key, value]) => ({
      key,
      label: value.label,
      lang: value.lang ?? key,
    })),
  )
}
