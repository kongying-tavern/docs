import type { HeadConfig, PageData, SiteConfig } from 'vitepress'
import { SITE_BASE, SITE_ORIGIN } from '../../src/constants/site'
import { sitePreferencesBootScript } from '../../src/services/sitePreferences'
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

/** 字体样式表（字体管线生成到 public/fonts/）非阻塞加载：preload 提前拉取，media="print" 应用不阻塞渲染；dev 由 loadFontStylesheets.ts 注入 */
const fontStylesheetHead: HeadConfig[] = ['/fonts/fonts-subset.css', '/fonts/fonts-standard.css']
  .flatMap(href => [
    ['link', { rel: 'preload', as: 'style', href: `${SITE_ORIGIN}${SITE_BASE}${href}` }],
    ['link', { rel: 'stylesheet', href: `${SITE_ORIGIN}${SITE_BASE}${href}`, media: 'print', onload: 'this.media=\'all\'' }],
  ])

export const productionHead: HeadConfig[] = [
  ...fontStylesheetHead,
  [
    'script',
    {
      id: 'clarity-script',
    },
    `
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        try {
          if(c.localStorage.getItem('telemetry:error-reporting:v1')==='false')
            c[a]('consentv2',{ad_Storage:'denied',analytics_Storage:'denied'});
        } catch(e) {}
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        t.onload=function(){c.document.documentElement.dataset.clarityLoaded="true";c.dispatchEvent(new Event("clarity-ready"))};
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
): HeadConfig[] {
  if (!isProd)
    return []

  const pageUrl = cfgGetPageUrl(pageData, siteConfig)
  const pageTitle = cfgGetPageTitle(pageData, siteConfig)
  const pageDesc = cfgGetPageDesc(pageData, siteConfig)
  const pageKeywords = cfgGetPageKeywords(pageData, siteConfig)
  const pageCover = cfgGetPageCover(pageData, siteConfig)

  // 返回值经 transformHead 合并进每页 <head>，mergeHead 按首个 meta 属性去重
  return [
    ['meta', { name: 'description', content: pageDesc }],
    ['meta', { name: 'keywords', content: pageKeywords }],
    ['meta', { property: 'og:url', content: pageUrl }],
    ['meta', { property: 'og:title', content: pageTitle }],
    ['meta', { property: 'og:description', content: pageDesc }],
    ['meta', { property: 'og:image', content: pageCover }],
    ['meta', { name: 'twitter:url', content: pageUrl }],
    ['meta', { name: 'twitter:title', content: pageTitle }],
    ['meta', { name: 'twitter:description', content: pageDesc }],
    ['meta', { name: 'twitter:image', content: pageCover }],
  ]
}

export const commonHead: HeadConfig[] = [
  ['script', { id: 'site-preferences-script' }, sitePreferencesBootScript],
  [
    'meta',
    {
      name: 'viewport',
      content:
        'width=device-width,initial-scale=1,viewport-fit=cover',
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
  ['meta', { name: 'theme-color', content: '#1b1b1f', media: '(prefers-color-scheme: dark)' }],
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
      rel: 'icon',
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
