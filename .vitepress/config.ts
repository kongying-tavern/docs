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
    search: {
      provider: 'local',
      options: localeSearchConfig,
    },
  },
  vite: {
    configFile: fileURLToPath(import.meta.resolve('../vite.config.ts')),
  },
  ...createConfigureFunction(),
  transformPageData(pageData) {
    pageData.frontmatter.breadcrumbs = [
      ...pageData.relativePath.split('/').slice(0, -1),
      pageData.title,
    ]
  },
})
