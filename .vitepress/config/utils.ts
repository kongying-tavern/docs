import type { PageData, SiteConfig } from 'vitepress'

export const isProd = process.env.NODE_ENV === 'production'

export const cfgGetPageUrl = (
  pageData: PageData,
  siteConfig: SiteConfig,
): string =>
  `https://yuanshen.site/${siteConfig.site.base}${pageData.relativePath.replace('.md', '')}`

export const cfgGetPageTitle = (
  pageData: PageData,
  siteConfig: SiteConfig,
): string =>
  pageData.frontmatter.title ? pageData.frontmatter.title : 'Kongying Tavern'
export const cfgGetPageDesc = (
  pageData: PageData,
  siteConfig: SiteConfig,
): string =>
  pageData.frontmatter.description
    ? pageData.frontmatter.description
    : `Genshin Interactive Map\nA Completionist's Interactive Map by Kongying Tavern`
export const cfgGetPageKeywords = (
  pageData: PageData,
  siteConfig: SiteConfig,
): string =>
  pageData.frontmatter.keywords
    ? pageData.frontmatter.keywords
    : '空荧酒馆,空荧地图,空荧酒馆原神地图,原神全资源攻略地图,原神攻略地图,原神地图,原神电子地图,原神互动地图,Genshin,Genshin_map,Genshin_Treasure,Genshin Map,Genshin Impact Map,Genshin Impact Interactive Map'
export const cfgGetPageCover = (
  pageData: PageData,
  siteConfig: SiteConfig,
): string =>
  pageData.frontmatter.image
    ? pageData.frontmatter.image
    : 'https://yuanshen.site/docs/imgs/common/cover.jpg'
