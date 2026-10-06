import type { DefaultTheme } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { Features } from 'lightningcss'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import llmstxt from 'vitepress-plugin-llms'
import { DEFAULT_LOCALE } from './.vitepress/locales/common/site'
import zhConstants from './.vitepress/locales/zh/constants'
import zhSidebar from './.vitepress/locales/zh/sidebar'
import { fontSubsetPlugin } from './.vitepress/plugins/font-subset'
import { mdcMetadataPlugin } from './.vitepress/plugins/mdc-metadata'
import openInEditor from './.vitepress/plugins/open-in-editor'
import { fontaineFallbackPlugin } from './scripts/font_subset/fontaine'

// llms 1.14 drops the site base in nested sidebar groups; keep section entries flat.
function flattenSidebarItems(items: DefaultTheme.SidebarItem[]): DefaultTheme.SidebarItem[] {
  return items.flatMap(({ items: children, ...item }) => [
    ...(item.link ? [item] : []),
    ...flattenSidebarItems(children ?? []),
  ])
}

export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      drafts: { customMedia: true },
      include: Features.Nesting | Features.CustomMediaQueries,
    },
  },
  build: {
    // The route-local Forum editor is ~572 kB raw (~154 kB Brotli).
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: true,
    fs: {
      allow: ['../..'],
    },
  },
  resolve: {
    alias: [
      {
        find: /^.*\/VPFooter\.vue$/,
        replacement: fileURLToPath(
          new URL('./.vitepress/theme/components/Footer.vue', import.meta.url),
        ),
      },
      {
        find: '@',
        replacement: fileURLToPath(
          new URL('./.vitepress/theme', import.meta.url),
        ),
      },
      {
        find: '~',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  plugins: [
    fontSubsetPlugin(),

    // https://github.com/antfu/unocss
    UnoCSS(),

    // https://github.com/unjs/fontaine
    fontaineFallbackPlugin(),
    openInEditor(),
    vueDevTools(),
    llmstxt({
      // Chinese is the source locale; translated copies would duplicate the corpus.
      workDir: DEFAULT_LOCALE,
      domain: new URL(zhConstants.META_URL).origin,
      title: `${zhConstants.META_TITLE}原神地图文档`,
      description: zhConstants.META_DESCRIPTION,
      details: '涵盖地图客户端使用手册、常见问题、下载与社区说明。本文档以中文原文为准。',
      sidebar: Object.values(zhSidebar).flat().map(section => ({
        ...section,
        items: flattenSidebarItems(section.items ?? []),
      })),
      // Keep static documentation; component-only pages have no useful Markdown body.
      ignoreFiles: [
        'feedback.md',
        'callback.md',
        'settings*.md',
        'sitemap.md',
        'staff.md',
        'frontmatter.md',
        'md-enhance-guide.md',
        // The default blog/* pattern does not cover nested changelog sources.
        'blog/**',
      ],
    }),
    mdcMetadataPlugin(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  json: {
    stringify: true,
  },
})
