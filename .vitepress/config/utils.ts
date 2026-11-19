import type { PageData } from 'vitepress'
import process from 'node:process'
import { SITE_ORIGIN } from '../../src/constants/site.ts'

export const isProd = process.env.NODE_ENV === 'production'

export function getDeploymentOrigin(): string {
  return new URL(process.env.VITEPRESS_HOSTNAME || SITE_ORIGIN).origin
}

export function cfgGetPageTitle(pageData: PageData): string {
  return pageData.frontmatter.title
    ? pageData.frontmatter.title
    : 'Kongying Tavern'
}
export function cfgGetPageDesc(pageData: PageData): string {
  return pageData.frontmatter.description
    ? pageData.frontmatter.description
    : 'Genshin Interactive Map - A Completionist\'s Interactive Map by Kongying Tavern'
}
export function cfgGetPageKeywords(pageData: PageData): string {
  return pageData.frontmatter.keywords
    ? pageData.frontmatter.keywords
    : '空荧酒馆,空荧地图,空荧酒馆原神地图,原神全资源攻略地图,原神攻略地图,原神地图,原神电子地图,原神互动地图,Genshin,Genshin_map,Genshin_Treasure,Genshin Map,Genshin Impact Map,Genshin Impact Interactive Map'
}
export function cfgGetPageCover(pageData: PageData, deploymentUrl: URL): string {
  return pageData.frontmatter.image
    ? pageData.frontmatter.image
    : new URL('imgs/common/cover.jpg', deploymentUrl).href
}
