import type { DefaultTheme, UserConfig } from 'vitepress'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { generateBreadcrumbsData } from './config/breadcrumbsDataGenerator.ts'
import { createConfigureFunction } from './config/common.ts'
import { createHeadConfig } from './config/head.ts'
import { ignoreDeadLinksConfig } from './config/ignoreDeadLinks.ts'
import { createLocalesConfig } from './config/locales.ts'
import { markdownConfig } from './config/markdown.ts'
import { rewritesConfig } from './config/rewrites.ts'
import { localeSearchConfig } from './config/search.ts'
import { sitemapConfig } from './config/sitemap.ts'
import { cfgDynamicTitleTemplate } from './config/title.ts'

export default async (): Promise<UserConfig<DefaultTheme.Config>> => ({
  base: '/docs/',
  srcDir: 'src',
  outDir: './dist',
  cacheDir: process.env.VITEPRESS_CACHE_DIR,
  srcExclude: [],
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
