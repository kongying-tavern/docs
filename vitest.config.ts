import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
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
        'src/apis/**/*.ts',
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
