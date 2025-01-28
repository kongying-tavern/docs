import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

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
  ],
  json: {
    stringify: true,
  },
})
