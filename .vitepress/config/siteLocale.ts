import type { Plugin } from 'vite'
import type { SiteLocale } from '../locales/types.ts'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { JSON_SCHEMA, load } from 'js-yaml'
import { normalizePath } from 'vite'
import { SITE_BASE, SITE_ORIGIN } from '../../src/constants/site.ts'
import { SHARED_THEME_CONFIG, SITE_IMAGE, SITE_LOGO } from '../locales/common.ts'
import { getLocaleDirs, LOCALES_DIR } from './localeDirs.ts'

type SiteLocaleYaml = Omit<SiteLocale, 'themeConfig'> & {
  themeConfig: Omit<SiteLocale['themeConfig'], 'ui'> & {
    ui: { title: { templateMappings: Array<{ test: string, template: string }> } }
  }
}

/** Read declarative VitePress settings and attach the shared executable configuration. */
export function loadSiteLocale(url: URL): SiteLocale {
  const config = load(readFileSync(url, 'utf8'), { schema: JSON_SCHEMA, filename: url.pathname }) as SiteLocaleYaml
  if (!config?.label || !config.lang || !config.title || !config.themeConfig)
    throw new Error(`Missing label, lang, title or themeConfig in ${url.pathname}`)
  const theme = config.themeConfig
  return {
    ...config,
    head: [
      ['meta', { property: 'og:site_name', content: config.title }],
      ['meta', { property: 'og:locale', content: config.lang }],
    ],
    themeConfig: {
      ...SHARED_THEME_CONFIG,
      ...theme,
      siteTitle: config.title,
      logo: SITE_LOGO,
      image: `${SITE_ORIGIN}${SITE_BASE}${SITE_IMAGE}`,
      forum: {
        ...SHARED_THEME_CONFIG.forum,
        aside: { ...SHARED_THEME_CONFIG.forum.aside, ...theme.forum?.aside },
      },
      ui: {
        title: {
          templateMappings: theme.ui.title.templateMappings.map(({ test, template }) => ({
            test: new RegExp(test),
            template,
          })),
        },
      },
    },
  }
}

/** Register YAML alongside TS dependencies so VitePress reloads its locale config in dev. */
export function siteLocaleWatchPlugin(): Plugin {
  return {
    name: 'site-locale-config',
    apply: 'serve',
    configResolved(config) {
      config.vitepress?.configDeps.push(...getLocaleDirs().map(locale => normalizePath(join(LOCALES_DIR, locale, 'site.yml'))))
    },
  }
}
