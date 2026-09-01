import type { DefaultTheme, HeadConfig, LocaleConfig } from 'vitepress'
import type { LocaleConfigShape } from '../locales/types'
import { DEFAULT_LOCALE, SITE_LOGO } from '../locales/common/site'
import { baseHelper } from '../theme/utils'
import { getLocaleDirs } from './localeDirs'

// 约定:locales 目录下含 index.ts 的子目录即一门语言,导出 <lang>Config/label/lang;zh 为默认语言(root)
const STATIC_FIELDS = [
  ['notFound', '404'],
  ['ui', 'ui'],
  ['asideLinks', 'aside-links'],
  ['docReaction', 'docs-feedback'],
  ['staff', 'staff'],
  ['team', 'team'],
  ['payment', 'payment'],
  ['forum', 'forum'],
  ['changelog', 'changelog'],
] as const
const LINKED_FIELDS = ['nav', 'sidebar', 'footer'] as const

export async function createLocalesConfig(): Promise<LocaleConfig<DefaultTheme.Config>> {
  const locales: LocaleConfig<DefaultTheme.Config> = {}
  for (const lang of getLocaleDirs()) {
    const mod = (await import(`../locales/${lang}/index.ts`)) as {
      label: string
      lang: string
      [key: string]: unknown
    }
    const config = mod[`${lang}Config`] as LocaleConfigShape
    if (!config) {
      throw new Error(`Missing ${lang}Config export in .vitepress/locales/${lang}/index.ts`)
    }

    const constants = (await import(`../locales/${lang}/constants.ts`)).default
    const themeConfig: Record<string, unknown> = {
      siteTitle: constants.META_TITLE,
      keyword: constants.META_KEYWORDS,
      image: constants.META_IMAGE,
      logo: SITE_LOGO,
    }
    for (const [field, module] of STATIC_FIELDS) {
      themeConfig[field] = (await import(`../locales/${lang}/${module}.ts`)).default
    }
    for (const field of LINKED_FIELDS) {
      const content = (await import(`../locales/${lang}/${field}.ts`)).default
      themeConfig[field] = baseHelper(content, constants.LOCAL_BASE)
    }
    Object.assign(themeConfig, config.themeConfig)

    const head = (await import(`../locales/${lang}/head.ts`)).default as HeadConfig[]
    const key = mod.lang === DEFAULT_LOCALE ? 'root' : lang
    locales[key] = {
      label: mod.label,
      lang: mod.lang,
      ...config,
      description: constants.META_DESCRIPTION,
      head,
      themeConfig: themeConfig as DefaultTheme.Config,
    }
  }
  return locales
}
