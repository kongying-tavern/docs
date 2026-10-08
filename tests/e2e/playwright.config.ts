import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

const port = Number(process.env.FORUM_E2E_PORT || 5174)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    env: {
      VITE_COLADA_DEVTOOLS: 'false',
      VITE_DEVTOOLS: 'false',
      VITEPRESS_CACHE_DIR: '.vitepress/cache/forum-e2e',
    },
    command: `pnpm exec vitepress dev --base / --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  outputDir: '../../test-results/forum',
  // Relative reporter output paths resolve against this config's directory, so the
  // report is placed beside test-results/ at the repository root for CI upload.
  reporter: process.env.CI ? [['line'], ['html', { outputFolder: '../../playwright-report', open: 'never' }]] : 'list',
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
