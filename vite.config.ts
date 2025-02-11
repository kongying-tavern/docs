import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { FontaineTransform } from 'fontaine'

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

    // https://github.com/unjs/fontaine
    FontaineTransform.vite({
      fallbacks: ['Arial'],
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
