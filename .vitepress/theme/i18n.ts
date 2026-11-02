import type { SiteData } from 'vitepress'
import type { App } from 'vue'
import type { DefineLocaleMessage } from 'vue-i18n'
import { useData } from 'vitepress'
import { watch } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'
import { DEFAULT_LOCALE } from '../../src/constants/site'

const resources = import.meta.glob<DefineLocaleMessage>(['../locales/*/*.yml', '!../locales/*/site.yml'], { import: 'default' })

export function interfaceLocaleForHref(href: string, site: SiteData): string {
  const pathname = new URL(href, 'https://vitepress.local').pathname
  const relativePath = pathname.startsWith(site.base) ? pathname.slice(site.base.length) : pathname.slice(1)
  return Object.keys(site.locales).find(key => key !== 'root' && relativePath.startsWith(`${key}/`)) ?? 'root'
}

export async function installI18n(app: App, initialLocale = DEFAULT_LOCALE) {
  // Resource modules may be cached, but every SSR app owns its composer and messages.
  const i18n = createI18n({
    legacy: false,
    globalInjection: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    messages: {} as Record<string, DefineLocaleMessage>,
  })
  const pending = new Map<string, Promise<void>>()
  function loadLocale(localeIndex: string): Promise<void> {
    const locale = localeIndex === 'root' ? DEFAULT_LOCALE : localeIndex
    if (i18n.global.availableLocales.includes(locale))
      return Promise.resolve()
    const existing = pending.get(locale)
    if (existing)
      return existing
    const entries = Object.entries(resources).filter(([path]) => path.startsWith(`../locales/${locale}/`))
    const loading = Promise.all(entries.map(async ([path, load]) => [path.split('/').at(-1)!.slice(0, -4), await load()] as const))
      .then((messages) => {
        if (!messages.length)
          throw new Error(`Unknown interface locale: ${locale}`)
        i18n.global.setLocaleMessage(locale, Object.fromEntries(messages))
      })
      .finally(() => pending.delete(locale))
    pending.set(locale, loading)
    return loading
  }
  await Promise.all([loadLocale(DEFAULT_LOCALE), loadLocale(initialLocale)])
  app.use(i18n)
  return loadLocale
}

export function setupI18n() {
  const { localeIndex } = useData()
  const { locale } = useI18n({ useScope: 'global' })
  watch(localeIndex, (current) => {
    locale.value = current === 'root' ? DEFAULT_LOCALE : current
  }, { immediate: true, flush: 'sync' })
}
