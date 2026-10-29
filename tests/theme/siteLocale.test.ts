import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSON_SCHEMA, load } from 'js-yaml'
import { test } from 'vitest'
import { getLocaleDirs } from '../../.vitepress/config/localeDirs.ts'
import { createLocalesConfig } from '../../.vitepress/config/locales.ts'
import { loadSiteLocale } from '../../.vitepress/config/siteLocale.ts'
import { DEFAULT_LOCALE, SHARED_THEME_CONFIG } from '../../.vitepress/locales/common.ts'
import { SITE_BASE, SITE_ORIGIN } from '../../src/constants/site.ts'

test('site YAML retains native VitePress fields, locale paths and executable title rules', async () => {
  const locales = await createLocalesConfig()
  for (const locale of getLocaleDirs()) {
    const url = new URL(`../../.vitepress/locales/${locale}/site.yml`, import.meta.url)
    const raw = load(readFileSync(url, 'utf8'), { schema: JSON_SCHEMA }) as { label: string, lang: string, title: string, description: string }
    const config = loadSiteLocale(url)
    assert.equal(config.label, raw.label)
    assert.equal(config.lang, raw.lang)
    assert.equal(config.title, raw.title)
    assert.equal(config.description, raw.description)
    assert.deepEqual(config.head, [
      ['meta', { property: 'og:site_name', content: raw.title }],
      ['meta', { property: 'og:locale', content: raw.lang }],
    ])
    const rule = config.themeConfig.ui.title.templateMappings[0]
    assert.equal(rule.test.test('manual/client/install'), true)
    assert.equal(rule.test.test('manual/faq/install'), false)
    const key = locale === DEFAULT_LOCALE ? 'root' : locale
    const sidebar = locales[key].themeConfig!.sidebar
    assert.ok(sidebar && !Array.isArray(sidebar))
    assert.ok(`${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/manual` in sidebar)
    assert.deepEqual(config.themeConfig.forum.aside.teamBlog, SHARED_THEME_CONFIG.forum.aside.teamBlog)
    assert.ok(config.themeConfig.languageSuggest.changeLanguage)
  }
})

test('menu paths keep the same meaning across locales and fallback links resolve to existing pages', () => {
  const localeCodes = getLocaleDirs()
  function destination(link: string): string {
    const url = new URL(link, SITE_ORIGIN)
    if (url.origin !== SITE_ORIGIN)
      return url.href
    let path = url.pathname
    if (path.startsWith(`${SITE_BASE}/`))
      path = path.slice(SITE_BASE.length)
    const locale = localeCodes.find(code => path.startsWith(`/${code}/`))
    if (locale)
      path = path.slice(locale.length + 1)
    return path.replace(/\/$/, '') + url.hash
  }
  function structure(value: unknown): unknown {
    if (Array.isArray(value))
      return value.map(structure)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, key === 'link' ? destination(String(child)) : ['text', 'title'].includes(key) ? typeof child : structure(child)]))
    }
    return value
  }
  let source: unknown
  for (const locale of localeCodes) {
    const { themeConfig: theme } = loadSiteLocale(new URL(`../../.vitepress/locales/${locale}/site.yml`, import.meta.url))
    const menus = { nav: theme.nav, sidebar: theme.sidebar, footer: theme.footer.navigation }
    const current = structure(menus)
    if (locale === DEFAULT_LOCALE)
      source = current
    else
      assert.deepEqual(current, source, `${locale} menu paths must match the source locale`)
    function checkFallbacks(value: unknown) {
      if (!value || typeof value !== 'object')
        return
      const item = value as { link?: string, text?: string }
      if (item.link?.startsWith(`${SITE_ORIGIN}${SITE_BASE}/`)) {
        const path = new URL(item.link).pathname.slice(SITE_BASE.length + 1)
        assert.ok(existsSync(new URL(`../../src/${path.replace(/\/$/, '/index')}.md`, import.meta.url)), item.link)
        assert.match(item.text ?? '', /英語|English/)
      }
      Object.values(value).forEach(checkFallbacks)
    }
    checkFallbacks(menus)
  }
})

test('invalid site identity or regular expressions fail during config loading', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'site-locale-'))
  t.onTestFinished(() => rmSync(root, { recursive: true, force: true }))
  const path = join(root, 'site.yml')
  writeFileSync(path, 'title: Incomplete\n')
  assert.throws(() => loadSiteLocale(pathToFileURL(path)), /Missing label, lang, title or themeConfig/)
  writeFileSync(path, 'label: English\nlang: en-US\ntitle: Site\nthemeConfig:\n  ui:\n    title:\n      templateMappings:\n        - test: "["\n          template: Manual\n')
  assert.throws(() => loadSiteLocale(pathToFileURL(path)), SyntaxError)
})
