import type { DefaultTheme, UserConfig } from 'vitepress'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { generateBreadcrumbsData } from './config/breadcrumbsDataGenerator.ts'
import { createHeadConfig } from './config/head.ts'
import { ignoreDeadLinksConfig } from './config/ignoreDeadLinks.ts'
import { createLocalesConfig } from './config/locales.ts'
import { markdownConfig } from './config/markdown.ts'
import { PAGES_DIR } from './config/pagesDir.ts'
import { getPageExclusions } from './config/pageVisibility.ts'
import { rewritesConfig } from './config/rewrites.ts'
import { localeSearchConfig } from './config/search.ts'
import { siteLocaleWatchPlugin } from './config/siteLocale.ts'
import { createSitemapConfig } from './config/sitemap.ts'
import { cfgDynamicTitleTemplate } from './config/title.ts'
import { fontSubsetPlugin } from './plugins/font-subset/index.ts'

export default (): UserConfig<DefaultTheme.Config> => ({
  base: process.env.VITEPRESS_BASE || '/docs/',
  srcDir: PAGES_DIR,
  outDir: process.env.VITEPRESS_OUT_DIR || './dist',
  cacheDir: process.env.VITEPRESS_CACHE_DIR,
  srcExclude: getPageExclusions(fileURLToPath(new URL(`../${PAGES_DIR}/`, import.meta.url))),
  cleanUrls: true,
  lastUpdated: true,
  locales: createLocalesConfig(),
  ...createSitemapConfig(),
  markdown: markdownConfig,
  head: createHeadConfig(),
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
    plugins: [fontSubsetPlugin(), siteLocaleWatchPlugin()],
    configFile: fileURLToPath(import.meta.resolve('../vite.config.ts')),
  },
  transformPageData(pageData, context) {
    generateBreadcrumbsData(pageData, context)
    const { siteConfig } = context
    cfgDynamicTitleTemplate(pageData, siteConfig)
  },
})
