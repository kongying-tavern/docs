import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_LOCALE } from '../locales/common/site'

export const LOCALES_DIR = fileURLToPath(new URL('../locales/', import.meta.url))

export function getLocaleDirs(): string[] {
  return readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(join(LOCALES_DIR, e.name, 'index.ts')))
    .map(e => e.name)
    .sort()
    .sort((a, b) => Number(b === DEFAULT_LOCALE) - Number(a === DEFAULT_LOCALE))
}
