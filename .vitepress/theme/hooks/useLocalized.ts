import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { CustomConfig } from '../../locales/types'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useData } from 'vitepress'
import { computed, toValue, watch } from 'vue'

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
    const resolvedDate = dayjs(toValue(date))
    const currentLocale = locales[localeIndex.value as keyof typeof locales]

    dayjs.locale(currentLocale)

    if (formatStr) {
      // 如果提供了格式化字符串，直接返回格式化后的日期
      return computed(() =>
        resolvedDate.locale(currentLocale).format(toValue(formatStr)),
      )
    }

    const now = dayjs()
    const diffInMinutes = now.diff(resolvedDate, 'minute')

    if (diffInMinutes < 720) {
      return computed(() => resolvedDate.fromNow())
    }

    if (resolvedDate.year() === now.year()) {
      return computed(() => resolvedDate.format('MM/DD HH:mm'))
    }

    return computed(() => resolvedDate.format('YYYY/MM/DD HH:mm'))
  }

  watch(localeIndex, () => {
    dayjs.locale(locales[localeIndex.value as keyof typeof locales])
  })

  return {
    message: theme,
    formatDate,
  }
}
