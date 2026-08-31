import type { DefaultTheme, UserConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'

import { generateBreadcrumbsData } from './config/breadcrumbsDataGenerator'
import { createConfigureFunction } from './config/common'
import { createHeadConfig } from './config/head'
import { ignoreDeadLinksConfig } from './config/ignoreDeadLinks'
import { createLocalesConfig } from './config/locales'
import { markdownConfig } from './config/markdown'
import { rewritesConfig } from './config/rewrites'
import { localeSearchConfig } from './config/search'
import { sitemapConfig } from './config/sitemap'
import { cfgDynamicTitleTemplate } from './config/title'

export default async (): Promise<UserConfig<DefaultTheme.Config>> => ({
  srcDir: 'src',
  outDir: './dist',
  srcExclude: [],
  scrollOffset: 'header',
  cleanUrls: true,
  lastUpdated: true,
  locales: await createLocalesConfig(),
  sitemap: sitemapConfig,
  markdown: markdownConfig,
  head: await createHeadConfig(),
  rewrites: rewritesConfig,
  ignoreDeadLinks: ignoreDeadLinksConfig,
  themeConfig: {
    outline: [2, 4],
    search: {
      provider: 'local',
      options: localeSearchConfig,
    },
  },
  vite: {
    configFile: fileURLToPath(import.meta.resolve('../vite.config.ts')),
  },
  ...createConfigureFunction(),
  transformPageData(pageData, context) {
    generateBreadcrumbsData(pageData, context)
    const { siteConfig } = context
    cfgDynamicTitleTemplate(pageData, siteConfig)
  },
})
