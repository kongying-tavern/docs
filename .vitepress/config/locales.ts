import type { DefaultTheme, LocaleConfig } from 'vitepress'
import { enConfig } from '../locales/en'
import { jaConfig } from '../locales/ja'
import { zhConfig } from '../locales/zh'

export const localesConfig: LocaleConfig<DefaultTheme.Config> = {
  root: {
    label: '简体中文',
    lang: 'zh-CN',
    ...zhConfig,
  },
  en: {
    label: 'English',
    lang: 'en-US',
    ...enConfig,
  },
  ja: {
    label: '日本語',
    lang: 'ja-JP',
    ...jaConfig,
  },
}
