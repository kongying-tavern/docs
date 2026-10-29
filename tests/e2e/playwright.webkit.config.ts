import { defineConfig } from '@playwright/test'
import config from './playwright.config'

export default defineConfig({
  ...config,
  projects: [{
    name: 'webkit-mobile-sidebar',
    testMatch: '**/sidebar-overlay.spec.ts',
    use: { browserName: 'webkit', isMobile: true, hasTouch: true },
  }],
})
