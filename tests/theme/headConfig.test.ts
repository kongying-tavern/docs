import type { PageData, SiteConfig } from 'vitepress'
import assert from 'node:assert/strict'
import { test } from 'vitest'
import { cfgDynamicHead } from '../../.vitepress/config/head'

test('dynamic SEO entries are returned without mutating frontmatter after head collection', () => {
  const page = {
    filePath: 'zh/index.md',
    relativePath: 'zh/index.md',
    title: 'Page title',
    description: 'Page description',
    headers: [],
    frontmatter: { title: 'Page title', description: 'Page description' },
  } as PageData
  const config = { site: { base: '/docs/' } } as SiteConfig
  const head = cfgDynamicHead(page, config)
  assert.deepEqual(head.find(entry => entry[1].property === 'og:title'), ['meta', { property: 'og:title', content: 'Page title' }])
  assert.deepEqual(head.find(entry => entry[1].name === 'description'), ['meta', { name: 'description', content: 'Page description' }])
  assert.equal(page.frontmatter.head, undefined)
})
