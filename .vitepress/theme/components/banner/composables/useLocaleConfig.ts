import { useData } from 'vitepress'
import { computed } from 'vue'

/** Site locales as the options the language-suggest bar offers. */
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
