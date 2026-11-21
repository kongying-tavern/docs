import type { PageData, SiteConfig, TransformContext } from 'vitepress'
import assert from 'node:assert/strict'
import { test } from 'vitest'
import { cfgDynamicHead } from '../../../../.vitepress/config/head.ts'
import { createSitemapConfig } from '../../../../.vitepress/config/sitemap.ts'

for (const base of ['/docs/', '/', '/preview/']) {
  test(`production font stylesheets load from the current deployment at ${base}`, () => {
    const page = { relativePath: 'zh/index.md', frontmatter: {} } as PageData
    const deployment = new URL(base, 'https://mirror.example')
    const links = cfgDynamicHead(page, base, deployment, '').filter(([tag, attrs]) => tag === 'link' && attrs.href?.includes('/fonts/'))
    assert.deepEqual(links.map(([, attrs]) => attrs.href), [
      `${base}fonts/fonts-subset.gen.css`,
      `${base}fonts/fonts-subset.gen.css`,
      `${base}fonts/fonts-standard.gen.css`,
      `${base}fonts/fonts-standard.gen.css`,
    ])
  })
}

test('dynamic SEO entries are returned without mutating frontmatter after head collection', () => {
  const page = {
    filePath: 'zh/index.md',
    relativePath: 'zh/index.md',
    title: 'Page title',
    description: 'Page description',
    headers: [],
    frontmatter: { title: 'Page title', description: 'Page description' },
  } as PageData
  const head = cfgDynamicHead(page, '/docs/', new URL('https://mirror.example/docs/'), '')
  assert.deepEqual(head.find(entry => entry[1].property === 'og:title'), ['meta', { property: 'og:title', content: 'Page title' }])
  assert.deepEqual(head.find(entry => entry[1].name === 'description'), ['meta', { name: 'description', content: 'Page description' }])
  assert.equal(page.frontmatter.head, undefined)
})

test('sitemap and social URLs use the same deployment and respect robots metadata', async () => {
  const { sitemap, transformHead } = createSitemapConfig()
  const siteConfig = { site: { base: '/_preview/docs/' }, cleanUrls: true } as SiteConfig
  const publicPage = { page: 'en/index.md', pageData: { frontmatter: {} }, siteConfig, head: [] } as unknown as TransformContext
  const tags = await transformHead!(publicPage) ?? []
  const url = new URL('en/', sitemap!.hostname).href
  assert.equal(new URL(url).pathname, '/_preview/docs/en/')
  assert.equal(tags.find(([, attrs]) => attrs.property === 'og:url')?.[1].content, url)
  assert.equal(tags.find(([, attrs]) => attrs.name === 'twitter:url')?.[1].content, url)

  await transformHead!({ ...publicPage, page: 'guide.md', head: [['meta', { name: 'robots', content: 'NOINDEX, nofollow' }]] })
  const privateTags = await transformHead!({ ...publicPage, page: 'en/_draft/index.md', head: [['meta', { name: 'robots', content: 'nofollow' }]] })
  assert.equal(privateTags?.find(([, attrs]) => attrs.name === 'robots')?.[1].content, 'nofollow, noindex')

  const links = [
    { lang: 'en', url: 'en/' },
    { lang: 'zh', url: 'guide' },
  ]
  const filtered = await sitemap!.transformItems!([
    { url: 'en/', links },
    { url: 'guide', links },
    { url: 'en/_draft/' },
  ])
  assert.deepEqual(filtered, [{ url: 'en/', links: [links[0]] }])
})
