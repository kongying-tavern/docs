import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../inferred-types'
import { baseHelper } from '../../theme/utils'
import jsonData from '../json/zh.json'
import { convertRegexObjects } from '../utils/regexConverter'
import { extractLocaleConfig } from '../utils/vitepressTypes'

// 将 JSON 数据转换后推断出正确的类型，并处理 VitePress 特定字段
const rawData = convertRegexObjects(jsonData)
const data = extractLocaleConfig(rawData)

// 从顶层提取 LOCAL_BASE
const localBase = data.LOCAL_BASE || '/'

export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config & CustomConfig> = {
  title: data.title,
  titleTemplate: data.titleTemplate,
  description: data.description,
  head: data.head,
  themeConfig: {
    siteTitle: data.siteTitle,
    keyword: data.keyword,
    image: data.image,
    logo: data.logo,
    outlineTitle: data.outlineTitle,
    lastUpdatedText: data.lastUpdatedText,
    returnToTopLabel: data.returnToTopLabel,
    langMenuLabel: data.langMenuLabel,
    notFound: data.notFound,
    ui: data.ui,
    asideLinks: data.asideLinks,
    docReaction: data.docReaction,
    docFooter: data.docFooter,
    staff: data.staff,
    team: data.team,
    payment: data.payment,
    forum: data.forum,
    changelog: data.changelog,
    nav: baseHelper(data.nav, localBase),
    sidebar: baseHelper(data.sidebar, localBase),
    footer: baseHelper(data.footer, localBase),
  },
}
