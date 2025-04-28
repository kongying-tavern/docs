import { fileURLToPath } from 'node:url'
import { FontaineTransform } from 'fontaine'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import openInEditor from './.vitepress/plugins/open-in-editor'

export default defineConfig({
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
    // https://github.com/antfu/unocss
    UnoCSS(),

    // https://github.com/unjs/fontaine
    FontaineTransform.vite({
      fallbacks: [
        'BlinkMacSystemFont',
        'Segoe UI',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
      ],
      resolvePath: id => new URL(`./public/fonts/${id}`, import.meta.url),
    }),
    openInEditor(),
    Inspect(),
    // llmstxt({
    //   workDir: 'zh',
    // }),
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
