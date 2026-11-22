import type { Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

/** Load source modules before starting controlled clocks and synchronous assertions. */
export async function warmModules(page: Page, ...specifiers: string[]): Promise<void> {
  await page.evaluate(paths => Promise.all(paths.map(path => import(/* @vite-ignore */ path))), specifiers)
}

const repositoryRoot = new URL('../../../', import.meta.url)

/** Resolve a repository-relative source file through Vite's filesystem URL. */
export function sourceModuleUrl(path: string): string {
  return `/@fs/${fileURLToPath(new URL(path.replace(/^\/+/u, ''), repositoryRoot)).replaceAll('\\', '/')}`
}

export const TELEMETRY_TOAST_MODULE = sourceModuleUrl('src/services/telemetry/toast.ts')
