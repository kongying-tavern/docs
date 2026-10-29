import type { DefaultTheme, LocaleConfig } from 'vitepress'
import type { SiteLocale } from '../locales/types.ts'
import { DEFAULT_LOCALE } from '../locales/common.ts'
import { baseHelper } from '../theme/utils.ts'
import { getLocaleDirs } from './localeDirs.ts'
import { localeImporters } from './localeImporters.ts'

export async function createLocalesConfig(): Promise<LocaleConfig<DefaultTheme.Config>> {
  const locales: LocaleConfig<DefaultTheme.Config> = {}
  const importers: Record<string, () => Promise<{ default: SiteLocale }>> = localeImporters
  for (const locale of getLocaleDirs()) {
    const load = importers[locale]
    if (!load)
      throw new Error(`Missing importer for "${locale}"; run pnpm init:locale`)
    const { default: config } = await load()
    const theme = config.themeConfig
    const base = locale === DEFAULT_LOCALE ? '/' : `/${locale}`
    locales[locale === DEFAULT_LOCALE ? 'root' : locale] = {
      ...config,
      themeConfig: {
        ...theme,
        nav: theme.nav && baseHelper(theme.nav, base),
        sidebar: theme.sidebar && baseHelper(theme.sidebar, base),
        footer: baseHelper({ ...theme.footer }, base),
      },
    }
  }
  return locales
}
