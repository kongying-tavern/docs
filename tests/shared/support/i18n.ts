import type { DefineLocaleMessage } from 'vue-i18n'
import { readdirSync, readFileSync } from 'node:fs'
import { JSON_SCHEMA, load } from 'js-yaml'

export function loadTestMessages(locale: string): DefineLocaleMessage {
  const directory = new URL(`../../../.vitepress/locales/${locale}/`, import.meta.url)
  return Object.fromEntries(readdirSync(directory, { withFileTypes: true })
    .filter(file => file.isFile() && file.name.endsWith('.yml') && file.name !== 'site.yml')
    .map(file => [file.name.slice(0, -4), load(readFileSync(new URL(file.name, directory), 'utf8'), { schema: JSON_SCHEMA })])) as DefineLocaleMessage
}
