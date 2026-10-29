import type { App } from 'vue'
import type { DefineLocaleMessage } from 'vue-i18n'
import { useData } from 'vitepress'
import { watch } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'
import { DEFAULT_LOCALE } from '../../src/constants/site'

const messages: Record<string, DefineLocaleMessage> = {}
const resources = import.meta.glob(['../locales/*/*.yml', '!../locales/*/site.yml'], { eager: true, import: 'default' })
for (const [path, resource] of Object.entries(resources)) {
  const [, locale, namespace] = path.match(/\/locales\/([^/]+)\/([^/]+)\.yml$/)!
  messages[locale] ??= {} as DefineLocaleMessage
  Object.assign(messages[locale], { [namespace]: resource })
}

export function installI18n(app: App) {
  // One composer per app: SSG renders must never share a mutable locale singleton.
  app.use(createI18n({
    legacy: false,
    globalInjection: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    messages,
  }))
}

export function setupI18n() {
  const { localeIndex } = useData()
  const { locale } = useI18n({ useScope: 'global' })
  watch(localeIndex, (current) => {
    locale.value = current === 'root' ? DEFAULT_LOCALE : current
  }, { immediate: true, flush: 'sync' })
}
