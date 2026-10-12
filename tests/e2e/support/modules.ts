import type { Page } from '@playwright/test'

/** Load source modules before starting controlled clocks and synchronous assertions. */
export async function warmModules(page: Page, ...specifiers: string[]): Promise<void> {
  await page.evaluate(paths => Promise.all(paths.map(path => import(/* @vite-ignore */ path))), specifiers)
}

export const TELEMETRY_TOAST_MODULE = '/services/telemetry/toast.ts'
