import type { DefaultTheme, LocaleConfig } from 'vitepress'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { DEFAULT_LOCALE } from '../locales/common.ts'
import { baseHelper } from '../theme/lib/link.ts'
import { getLocaleDirs, LOCALES_DIR } from './localeDirs.ts'
import { loadSiteLocale } from './siteLocale.ts'

export function createLocalesConfig(): LocaleConfig<DefaultTheme.Config> {
  const locales: LocaleConfig<DefaultTheme.Config> = {}
  for (const locale of getLocaleDirs()) {
    const config = loadSiteLocale(pathToFileURL(join(LOCALES_DIR, locale, 'site.yml')))
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
