import type { DefaultTheme, UserConfig } from 'vitepress'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cfgDynamicHead } from './head.ts'
import { getDeploymentOrigin } from './utils.ts'

export function createSitemapConfig(): Pick<UserConfig<DefaultTheme.Config>, 'sitemap' | 'transformHead' | 'buildEnd'> {
  const origin = getDeploymentOrigin()
  const excludedPaths = new Set<string>()
  let deploymentUrl: URL | undefined
  const sitemap = {
    hostname: origin,
    transformItems: items => items
      .filter(({ url }) => !excludedPaths.has(url))
      .map(item => item.links ? { ...item, links: item.links.filter(({ url }) => !excludedPaths.has(url)) } : item),
  } satisfies NonNullable<UserConfig['sitemap']>

  return {
    sitemap,
    transformHead({ page, pageData, siteConfig, head }) {
      // VitePress applies --base before rendering and generates its sitemap after rendering.
      deploymentUrl ??= new URL(siteConfig.site.base, origin)
      sitemap.hostname = deploymentUrl.href

      // Match VitePress's sitemap paths, using the rewritten output page.
      const path = page.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, siteConfig.cleanUrls ? '' : '.html')
      const tags = cfgDynamicHead(pageData, siteConfig.site.base, deploymentUrl, path)
      const robots = head.findLast(([tag, attrs]) => tag === 'meta' && attrs.name?.toLowerCase() === 'robots')
      const directives = robots?.[1].content
      const noindex = directives?.toLowerCase().split(/[\s,]+/).some(value => value === 'noindex' || value === 'none')
      const privatePath = page.split('/').some(segment => segment.startsWith('_'))
      if (privatePath && !noindex) {
        tags.push(['meta', { ...robots?.[1], name: 'robots', content: directives ? `${directives}, noindex` : 'noindex' }])
      }
      if (privatePath || noindex)
        excludedPaths.add(path)
      return tags
    },
    async buildEnd({ outDir, site }) {
      const sitemapUrl = new URL('sitemap.xml', deploymentUrl ?? new URL(site.base, origin))
      await writeFile(join(outDir, 'robots.txt'), `Sitemap: ${sitemapUrl.href}\n`)
    },
  }
}
