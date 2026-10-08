import type { Page } from '@playwright/test'

/**
 * Load modules that a spec drives through `page.evaluate` before it asserts on them.
 *
 * Vite re-optimizes dependencies the first time a module graph reaches a new
 * package. That optimization reloads the page, which destroys an in-flight
 * `page.evaluate` promise ("Resulting promise was garbage collected") and drops
 * whatever the evaluate had already triggered. Warming the module first keeps the
 * reload out of the assertions; a reload that lands during a warm-up is fine,
 * because the retry runs against the reloaded page.
 */
export async function warmModules(page: Page, ...specifiers: string[]): Promise<void> {
  for (const specifier of specifiers) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.evaluate((path: string) => import(/* @vite-ignore */ path), specifier)
        break
      }
      catch (error) {
        if (attempt === 3)
          throw error
        await page.waitForLoadState('load')
      }
    }
  }
}

export const TELEMETRY_TOAST_MODULE = '/services/telemetry/toast.ts'
