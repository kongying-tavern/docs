import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

import { generateBreadcrumbsData } from './config/breadcrumbsDataGenerator'
import { createConfigureFunction } from './config/common'
import { headConfig } from './config/head'
import { ignoreDeadLinksConfig } from './config/ignoreDeadLinks'
import { localesConfig } from './config/locales'
import { markdownConfig } from './config/markdown'
import { rewritesConfig } from './config/rewrites'
import { localeSearchConfig } from './config/search'
import { sitemapConfig } from './config/sitemap'

export default defineConfig({
  srcDir: 'src',
  outDir: './dist',
  srcExclude: [],
  scrollOffset: 'header',
  cleanUrls: true,
  lastUpdated: true,
  locales: localesConfig,
  sitemap: sitemapConfig,
  markdown: markdownConfig,
  head: headConfig,
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
  },
})
