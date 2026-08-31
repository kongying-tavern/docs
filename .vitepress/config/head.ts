import type { HeadConfig, PageData, SiteConfig } from 'vitepress'
import { SITE_BASE, SITE_ORIGIN } from '../../src/constants/site'
import { DEFAULT_LOCALE } from '../locales/common/site'
import { getLocaleDirs } from './localeDirs'
import {
  cfgGetPageCover,
  cfgGetPageDesc,
  cfgGetPageKeywords,
  cfgGetPageTitle,
  cfgGetPageUrl,
  isProd,
} from './utils'

export const productionHead: HeadConfig[] = [
  [
    'script',
    {
      id: 'clarity-script',
    },
    `
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "gx0jeyqvg5")`,
  ],
  [
    'script',
    {
      id: 'application-json',
      type: 'application/ld+json',
    },
    `
    {"@context":"https://schema.org","@type":"WebPage","name":"Kongying Tavern Genshin Interactive Map"}`,
  ],
]

export function cfgDynamicHead(
  pageData: PageData,
  siteConfig: SiteConfig,
): void {
  if (!isProd)
    return

  const pageUrl = cfgGetPageUrl(pageData, siteConfig)
  const pageTitle = cfgGetPageTitle(pageData, siteConfig)
  const pageDesc = cfgGetPageDesc(pageData, siteConfig)
  const pageKeywords = cfgGetPageKeywords(pageData, siteConfig)
  const pageCover = cfgGetPageCover(pageData, siteConfig)

  const head: HeadConfig[] = [
    ['meta', { name: 'og:url', content: pageUrl }],
    ['meta', { name: 'twitter:url', content: pageUrl }],
    ['meta', { name: 'og:title', content: pageTitle }],
    ['meta', { name: 'twitter:title', content: pageTitle }],
    ['meta', { name: 'og:description', content: pageDesc }],
    ['meta', { name: 'twitter:description', content: pageDesc }],
    ['meta', { name: 'description', content: pageDesc }],
    ['meta', { name: 'keywords', content: pageKeywords }],
    ['meta', { name: 'og:image', content: pageCover }],
    ['meta', { name: 'twitter:image', content: pageCover }],
  ]

  pageData.frontmatter.head ??= []
  pageData.frontmatter.head.splice(Number.POSITIVE_INFINITY, 0, ...head)
}

export const commonHead: HeadConfig[] = [
  [
    'meta',
    {
      name: 'viewport',
      content:
        'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,viewport-fit=cover',
    },
  ],
  [
    'meta',
    {
      name: 'applicable-device',
      content: 'pc,mobile',
    },
  ],
  [
    'meta',
    {
      name: 'google',
      content: 'notranslate',
    },
  ],
  ['meta', { name: 'theme-color', content: '#ffffff' }],
  ['meta', { name: 'color-scheme', content: 'dark light' }],
  [
    'link',
    {
      rel: 'icon',
      href: `${SITE_ORIGIN}${SITE_BASE}/imgs/common/favicon/favicon-32x32.png`,
      type: 'image/png',
    },
  ],
  [
    'link',
    {
      rel: 'alternate',
      href: `${SITE_ORIGIN}${SITE_BASE}/imgs/common/favicon/favicon.ico`,
      type: 'image/x-icon',
    },
  ],
  ['meta', { name: 'referrer', content: 'no-referrer-when-downgrade' }],
  ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ['meta', { name: 'twitter:creator', content: '@KongyingTavern' }],
]

async function createHreflangHead(): Promise<HeadConfig[]> {
  return getLocaleDirs().map(lang => [
    'link',
    {
      rel: 'alternate',
      hreflang: lang,
      href: lang === DEFAULT_LOCALE
        ? `${SITE_ORIGIN}${SITE_BASE}`
        : `${SITE_ORIGIN}${SITE_BASE}/${lang}`,
    },
  ])
}

export async function createHeadConfig(): Promise<HeadConfig[]> {
  return [
    ...commonHead,
    ...await createHreflangHead(),
    ...(isProd ? productionHead : []),
  ]
}
