// 生成的 zh.json 的准确类型定义
export interface ZhJsonData {
  title: string
  titleTemplate: string
  description: string
  head: Array<[string, Record<string, string>]>
  siteTitle: string
  keyword: string
  image: string
  logo: string
  outlineTitle: string
  lastUpdatedText: string
  returnToTopLabel: string
  langMenuLabel: string
  notFound: {
    title: string
    quote: string
    linkLabel: string
  }
  ui: {
    title: {
      templateMappings: Array<{
        test: RegExp | { __regex__: string, __flags__: string }
        template: string
      }>
    }
    banner: {
      wip: string
    }
    button: {
      search: string
      submit: string
      cancel: string
      loading: string
      close: string
      all: string
    }
    sitemap: {
      blog: string
      manual: string
      general: string
      api: string
      guide: string
      community: string
      about: string
    }
  }
  nav: Array<{
    text: string
    link?: string
    items?: Array<{
      text: string
      link?: string
      items?: Array<{
        text: string
        link: string
      }>
    }>
  }>
  sidebar: Record<string, Array<{
    text: string
    link?: string
    collapsed?: boolean
    items?: Array<{
      text: string
      link?: string
      items?: Array<{
        text: string
        link: string
      }>
    }>
  }>>
  footer: {
    qrcodeTitle: string
    qrcodeMessage: string
    qrcodeLink: string
    navigation: Array<{
      title: string
      items: Array<{
        text: string
        link: string
      }>
    }>
  }
  // Constants from constants.ts merged to top level
  META_URL?: string
  META_TITLE?: string
  META_DESCRIPTION?: string
  META_KEYWORDS?: string
  META_IMAGE?: string
  LOCAL_CODE?: string
  LOCAL_BASE?: string
  [key: string]: unknown
}
