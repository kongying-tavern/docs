import { fileURLToPath } from 'node:url'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import llmstxt from 'vitepress-plugin-llms'
import { fontSubsetPlugin } from './.vitepress/plugins/font-subset'
import { mdcMetadataPlugin } from './.vitepress/plugins/mdc-metadata'
import openInEditor from './.vitepress/plugins/open-in-editor'
import { fontaineFallbackPlugin } from './scripts/font_subset/fontaine'

export default defineConfig({
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
      ignoreFiles: ['feedback.md'],
      workDir: 'zh',
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
