import { defineConfig } from '@x18n/cli'
import { getLocaleDirs } from './.vitepress/config/localeDirs.ts'
import { DEFAULT_LOCALE } from './.vitepress/locales/common.ts'

export default defineConfig({
  sourceLocale: DEFAULT_LOCALE,
  locales: getLocaleDirs(),
  presets: ['vue-i18n'],
  resources: [{ pattern: '.vitepress/locales/{locale}/{namespace}.yml' }],
  usage: {
    include: ['src/**/*.{ts,vue}', '.vitepress/theme/**/*.{ts,vue}'],
    exclude: ['.vitepress/cache/**'],
  },
  checks: {
    // Whole sections are passed to child components and indexed dynamically.
    'unused-key': 'off',
    // Identical text can be intentional, especially for Japanese and URLs.
    'identical-to-source': 'info',
  },
  glossary: [{
    term: '反馈论坛',
    note: 'For forum.* messages, follow .github/forum-glossary.md and its contextual exceptions.',
  }],
})
