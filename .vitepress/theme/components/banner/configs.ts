import type { LanguageSuggestBarTranslate } from '../../../locales/common/LanguageSuggestBar'
import { localesConfig } from '../../../config/locales'

export const STORE_KEY = 'BANNER'
export const DEFAULT_LOCALE_CODE = 'zh'
export const LOCALE_CONFIG = Object.entries(localesConfig).map(
  ([key, value]) =>
    ({
      key,
      ...value,
    }) as {
      label: string
      lang: string
      key: keyof LanguageSuggestBarTranslate
    },
)
