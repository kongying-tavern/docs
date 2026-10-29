import { fileURLToPath } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), VueI18nPlugin({
    include: fileURLToPath(new URL('./.vitepress/locales/**/*.yml', import.meta.url)).replaceAll('\\', '/'),
    exclude: '**/site.yml',
    runtimeOnly: false,
    fullInstall: false,
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./.vitepress/theme', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/{forum,shared,theme,fonts}/**/*.test.ts'],
    environment: 'node',
    maxWorkers: 4,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      include: [
        'src/forum/{api,composables,hooks,router,services,stores,utils}/**/*.ts',
        'src/{composables,services,utils}/**/*.ts',
        '.vitepress/theme/hooks/**/*.ts',
        'scripts/font_subset/**/*.ts',
      ],
      exclude: ['**/*.d.ts', '**/types/**'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        'lines': 50,
        'statements': 50,
        'functions': 48,
        'branches': 49,
        'src/forum/hooks/{useAuthRefresh,useSSORefreshManager}.ts': {
          perFile: true,
          lines: 65,
          branches: 60,
        },
      },
    },
  },
})
