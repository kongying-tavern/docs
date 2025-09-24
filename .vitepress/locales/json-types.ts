import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from './types'

// JSON 中序列化的正则表达式格式
export interface SerializedRegex {
  __regex__: string
  __flags__: string
}

// 完全转换后的类型，包含 constants 常量
export interface ConvertedLocaleConfig extends LocaleSpecificConfig<CustomConfig & DefaultTheme.Config> {
  META_URL?: string
  META_TITLE?: string
  META_DESCRIPTION?: string
  META_KEYWORDS?: string
  META_IMAGE?: string
  LOCAL_CODE?: string
  LOCAL_BASE?: string
}
