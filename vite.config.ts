import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { FontaineTransform } from 'fontaine'
import Inspect from 'vite-plugin-inspect'

import UnoCSS from 'unocss/vite'

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

    Inspect(),
    // https://github.com/unjs/fontaine
    FontaineTransform.vite({
      fallbacks: [
        'BlinkMacSystemFont',
        'Segoe UI',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
      ],
      resolvePath: (id) => new URL(`./public/fonts/${id}`, import.meta.url),
    }),
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
