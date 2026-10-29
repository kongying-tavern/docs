import type { DefaultTheme, LocaleSpecificConfig, MarkdownOptions } from 'vitepress'
import type { SHARED_THEME_CONFIG } from './common.ts'

// Only project-specific theme fields extend VitePress's native configuration types.
export interface CustomConfig {
  forum: typeof SHARED_THEME_CONFIG.forum & { aside: { contactUs: { qrcodeLink: string } } }
  keyword: string
  image: string
  footer: {
    qrcodeTitle: string
    qrcodeAlt: string
    qrcodeMessage: string
    qrcodeLink: string
    navigation: Array<{ title: string, items: Array<{ text: string, link: string }> }>
  }
  ui: {
    title: { templateMappings: Array<{ test: RegExp, template: string }> }
  }
  languageSuggest: { changeLanguage: string, continue: string, ariaLabel: string }
}

export type SiteLocale = LocaleSpecificConfig<DefaultTheme.Config & CustomConfig> & {
  markdown?: Pick<MarkdownOptions, 'codeCopyButton'>
  label: string
  lang: string
  themeConfig: DefaultTheme.Config & CustomConfig
}
