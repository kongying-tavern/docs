import type { Composer } from 'vue-i18n'
import { describe, expect, test, vi } from 'vitest'
import { computed, createRenderer, createSSRApp, h, ref } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'
import { renderToString } from 'vue/server-renderer'
import { getLocaleDirs } from '../../.vitepress/config/localeDirs'
import Time from '../../.vitepress/theme/components/ui/Time/Time.vue'
import { installI18n, setupI18n } from '../../.vitepress/theme/i18n'
import { DEFAULT_LOCALE } from '../../src/constants/site'
import { relativeTimeValue } from '../../src/utils/dateTime'
import { loadTestMessages } from '../shared/support/i18n'

vi.mock('vitepress', async () => {
  const { computed, inject, ref } = await import('vue')
  return { useData: () => {
    const localeIndex = inject('test-locale', ref('root'))
    return { localeIndex, lang: computed(() => localeIndex.value === 'root' ? DEFAULT_LOCALE : localeIndex.value) }
  } }
})

function sourceCloseLabel(locale: string): string {
  return ((loadTestMessages(locale).ui as Record<string, unknown>).button as Record<string, string>).close
}

function page(locale: string) {
  const app = createSSRApp({
    setup() {
      setupI18n()
      const { t } = useI18n({ useScope: 'global' })
      return () => h('p', t('ui.button.close'))
    },
  })
  app.provide('test-locale', ref(locale))
  installI18n(app)
  return app
}

describe('VitePress vue-i18n integration', () => {
  test('renders named component slots without leaving translation placeholders', async () => {
    const app = createSSRApp({
      setup() {
        setupI18n()
        const { t } = useI18n({ useScope: 'global' })
        return () => h(I18nT, { keypath: 'forum.comment.commentAfterLogin', scope: 'global', tag: 'p' }, {
          login: () => h('button', t('forum.auth.login')),
        })
      },
    })
    app.provide('test-locale', ref('en'))
    installI18n(app)
    const html = await renderToString(app)
    expect(html).toContain('<button>')
    expect(html).not.toContain('{login}')
    expect(html).not.toContain('forum.comment.commentAfterLogin')
  })

  test('SSR time rendering accepts epoch zero and invalid dates without relative-clock drift', async () => {
    async function render(datetime: string | number) {
      const app = createSSRApp({ render: () => h(Time, { datetime, relative: true }) })
      app.provide('test-locale', ref('en'))
      return renderToString(app)
    }
    const epoch = await render(0)
    expect(epoch).toContain('datetime="1970-01-01T00:00:00.000Z"')
    expect(epoch).not.toContain('ago')
    expect(await render('invalid')).not.toContain('datetime=')
  })
  test('renders each locale in an isolated SSR app, including the root locale', async () => {
    const locales = getLocaleDirs()
    const html = await Promise.all(locales.map(locale => renderToString(page(locale === DEFAULT_LOCALE ? 'root' : locale))))
    for (const [index, locale] of locales.entries())
      expect(html[index]).toBe(`<p>${sourceCloseLabel(locale)}</p>`)
    expect(await renderToString(page('root'))).toBe(`<p>${sourceCloseLabel(DEFAULT_LOCALE)}</p>`)
  })

  test('updates existing callers on navigation and supports compiled messages, plural forms and literals', () => {
    interface Node { text: string, children: Node[] }
    const node = (text = ''): Node => ({ text, children: [] })
    const renderer = createRenderer<Node, Node>({
      createElement: () => node(),
      createText: text => node(text),
      createComment: () => node(),
      insert: (child, parent) => parent.children.push(child),
      remove: () => {},
      setText: (target, text) => target.text = text,
      setElementText: (target, text) => target.text = text,
      parentNode: () => null,
      nextSibling: () => null,
      patchProp: () => {},
    })
    let composer!: Composer
    const localeIndex = ref('root')
    const app = renderer.createApp({
      setup() {
        setupI18n()
        composer = useI18n({ useScope: 'global' })
        return () => h('p', composer.t('ui.button.close'))
      },
    })
    app.provide('test-locale', localeIndex)
    installI18n(app)
    app.mount(node())
    const label = computed(() => composer.t('ui.button.close'))
    expect(label.value).toBe(sourceCloseLabel(DEFAULT_LOCALE))
    localeIndex.value = 'en'
    expect(label.value).toBe('Close')
    expect(composer.t('forum.sidebar.totalComments', { count: 1 })).toBe('1 comment total')
    expect(composer.t('forum.sidebar.totalComments', { count: 2 })).toBe('2 comments total')
    expect(composer.t('forum.imagePreview.showImage', { index: 3 })).toContain('3')
    expect(composer.t('forum.topic.officialAt')).toBe('@Kongying-Tavern')
    for (const locale of getLocaleDirs()) {
      localeIndex.value = locale === DEFAULT_LOCALE ? 'root' : locale
      function check(value: unknown, key: string) {
        if (typeof value === 'string') {
          const params: Record<string, string | number> = { count: 2 }
          for (const match of value.matchAll(/\{([\w-]+)\}/g))
            params[match[1]] ??= `__${match[1]}__`
          const expected = (value.includes('|') ? value.split('|').at(-1)!.trim() : value)
            .replace(/\{'([^']*)'\}/g, (_match, literal: string) => literal)
            .replace(/\{([\w-]+)\}/g, (_match, name: string) => String(params[name]))
          expect(composer.t(key, params), `${locale}: ${key}`).toBe(expected)
        }
        else if (value && typeof value === 'object') {
          for (const [part, child] of Object.entries(value))
            check(child, Array.isArray(value) ? `${key}[${part}]` : key ? `${key}.${part}` : part)
        }
      }
      check(loadTestMessages(locale), '')
    }
    localeIndex.value = 'ja'
    expect(label.value).toBe(sourceCloseLabel('ja'))
    localeIndex.value = 'root'
    expect(label.value).toBe(sourceCloseLabel(DEFAULT_LOCALE))
    app.unmount()
  })
})

test('uses real relative-time unit boundaries in both directions', () => {
  for (const [seconds, value, unit] of [
    [0, 0, 'second'],
    [59, 59, 'second'],
    [60, 1, 'minute'],
    [3600, 1, 'hour'],
    [86400, 1, 'day'],
    [2592000, 1, 'month'],
    [31536000, 1, 'year'],
  ] as const) {
    expect(relativeTimeValue(seconds * 1000, 0)).toEqual({ value, unit })
    expect(relativeTimeValue(0, seconds * 1000)).toEqual({ value: value ? -value : 0, unit })
  }
})
