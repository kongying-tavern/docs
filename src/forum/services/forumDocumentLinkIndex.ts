import { SITE_BASE, SITE_ORIGIN } from '../../constants/site'

interface ForumDocumentPage {
  url: string
  src?: string
  frontmatter: Record<string, unknown>
}

export type ForumDocumentLinks = Record<string, string>

const HTML_SUFFIX = /(?:\.html)?\/?$/

export function buildForumDocumentLinks(pages: ForumDocumentPage[]): ForumDocumentLinks {
  return Object.fromEntries(pages.flatMap((page) => {
    const heading = page.src?.split('\n').find(line => line.startsWith('# '))?.slice(2)
    const title = String(page.frontmatter.title || heading || '').trim()
    if (!title)
      return []

    const path = page.url.replace(HTML_SUFFIX, '')
    const paths = path.startsWith('/zh/') ? [path, path.slice(3)] : [path]
    return paths.map(url => [url, title])
  }))
}

export function getForumDocumentTitle(
  href: string,
  links: Readonly<ForumDocumentLinks>,
): string | undefined {
  try {
    const url = new URL(href, SITE_ORIGIN)
    if (url.origin !== SITE_ORIGIN || !url.pathname.startsWith(`${SITE_BASE}/`))
      return
    const path = decodeURIComponent(url.pathname.slice(SITE_BASE.length)).replace(HTML_SUFFIX, '')
    return links[path]
  }
  catch {
    return undefined
  }
}
