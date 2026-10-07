import type { PageData, TransformPageContext } from 'vitepress'

export function generateBreadcrumbsData(
  pageData: PageData,
  { siteConfig }: TransformPageContext,
) {
  const segments = pageData.filePath.split('/').filter(Boolean)
  if (!segments.length)
    return

  const pages = new Set(siteConfig.pages)
  const pageLink = (source: string): string => {
    if (!pages.has(source))
      return ''

    const route = siteConfig.rewrites.map[source] ?? source
    const path = route.replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, siteConfig.cleanUrls ? '' : '.html')
    return `/${path.split('/').map(encodeURIComponent).join('/')}`
  }

  const breadcrumbs = [{
    title: siteConfig.site.title,
    link: pageLink(`${segments[0]}/index.md`),
  }]

  // Resolve real source pages before applying rewrites, including locale rewrites.
  for (let i = 1; i < segments.length - 1; i++) {
    const directory = segments.slice(0, i + 1).join('/')
    const landing = pages.has(`${directory}.md`)
      ? `${directory}.md`
      : `${directory}/index.md`
    breadcrumbs.push({ title: segments[i], link: pageLink(landing) })
  }

  if (segments.length > 1) {
    if (segments.at(-1) === 'index.md' && breadcrumbs.length > 1) {
      breadcrumbs[breadcrumbs.length - 1] = { title: pageData.title, link: '' }
    }
    else if (segments.at(-1) !== 'index.md') {
      breadcrumbs.push({ title: pageData.title, link: '' })
    }
  }

  pageData.frontmatter.breadcrumbs = breadcrumbs
}
