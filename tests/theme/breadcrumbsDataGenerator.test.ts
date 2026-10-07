import type { PageData, SiteConfig } from 'vitepress'
import { describe, expect, test } from 'vitest'
import { generateBreadcrumbsData } from '../../.vitepress/config/breadcrumbsDataGenerator'

const pages = ['zh/index.md', 'zh/blog.md', 'zh/blog/post.md', 'zh/manual/client/index.md', 'zh/manual/client/canvas.md', 'zh/manual/faq/login/account.md', 'en/index.md', 'en/manual/client/index.md', 'en/manual/client/canvas.md', 'zh/指南/index.md', 'zh/指南/入门.md']
const map = Object.fromEntries(pages.filter(p => p.startsWith('zh/')).map(p => [p, p.slice(3)]))

function generate(filePath: string, cleanUrls = true) {
  const page = { filePath, title: 'Page title', frontmatter: {} } as PageData
  const siteConfig = { pages, rewrites: { map, inv: {} }, cleanUrls, site: { title: 'Site' } } as SiteConfig
  generateBreadcrumbsData(page, { siteConfig })
  return page.frontmatter.breadcrumbs
}

describe('breadcrumb routes', () => {
  test('uses rewritten home and directory index routes', () => {
    expect(generate('zh/manual/client/canvas.md')).toEqual([
      { title: 'Site', link: '/' },
      { title: 'manual', link: '' },
      { title: 'client', link: '/manual/client/' },
      { title: 'Page title', link: '' },
    ])
  })

  test('links a sibling landing page and leaves missing directories unlinked', () => {
    expect(generate('zh/blog/post.md')[1]).toEqual({ title: 'blog', link: '/blog' })
    expect(generate('zh/manual/faq/login/account.md').slice(1, -1).map((item: { link: string }) => item.link)).toEqual(['', '', ''])
  })

  test('retains non-default locale routes', () => {
    expect(generate('en/manual/client/canvas.md')[0].link).toBe('/en/')
    expect(generate('en/manual/client/canvas.md')[2].link).toBe('/en/manual/client/')
  })

  test('uses the current title for an index without duplicating it', () => {
    expect(generate('zh/manual/client/index.md')).toEqual([
      { title: 'Site', link: '/' },
      { title: 'manual', link: '' },
      { title: 'Page title', link: '' },
    ])
    expect(generate('zh/index.md')).toHaveLength(1)
  })

  test('encodes route segments and respects HTML URLs', () => {
    expect(generate('zh/指南/入门.md')[1].link).toBe('/%E6%8C%87%E5%8D%97/')
    expect(generate('zh/blog/post.md', false)[1].link).toBe('/blog.html')
  })

  test('does not generate breadcrumbs for a page without a source', () => {
    expect(generate('')).toBeUndefined()
  })
})
