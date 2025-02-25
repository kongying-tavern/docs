import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { headConfig } from './config/head'
import { createConfigureFunction } from './config/common'
import { localeSearchConfig } from './config/search'
import { ignoreDeadLinksConfig } from './config/ignoreDeadLinks'
import { markdownConfig } from './config/markdown'
import { localesConfig } from './config/locales'
import { sitemapConfig } from './config/sitemap'
import { rewritesConfig } from './config/rewrites'
import { generateBreadcrumbsData } from './config/breadcrumbsDataGenerator'

export default defineConfig({
  srcDir: 'src',
  outDir: './dist',
  srcExclude: [],
  scrollOffset: 'header',
  cleanUrls: true,
  lastUpdated: true,
  title: '原神地图',
  locales: localesConfig,
  sitemap: sitemapConfig,
  markdown: markdownConfig,
  head: headConfig,
  rewrites: rewritesConfig,
  ignoreDeadLinks: ignoreDeadLinksConfig,
  themeConfig: {
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
