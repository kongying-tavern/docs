import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { CustomConfig } from '../../locales/types'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useData } from 'vitepress'
import { computed, toValue } from 'vue'

import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import 'dayjs/locale/ja'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

const locales = {
  root: 'zh-cn',
  en: 'en',
  ja: 'ja',
} as const

export function useLocalized() {
  const { theme, localeIndex } = useData<CustomConfig>()

  function formatDate(
    date: MaybeRefOrGetter<Date | number | string>,
    formatStr?: MaybeRefOrGetter<string>,
  ): ComputedRef<string> {
    return computed(() => {
      const currentLocale = locales[localeIndex.value as keyof typeof locales]
      const resolvedDate = dayjs(toValue(date)).locale(currentLocale)
      if (formatStr)
        return resolvedDate.format(toValue(formatStr))

      const now = dayjs()
      if (now.diff(resolvedDate, 'minute') < 720)
        return resolvedDate.fromNow()
      if (resolvedDate.year() === now.year())
        return resolvedDate.format('MM/DD HH:mm')
      return resolvedDate.format('YYYY/MM/DD HH:mm')
    })
  }

  return {
    message: theme,
    formatDate,
  }
}
