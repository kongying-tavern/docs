import type { LocaleSpecificConfig } from 'vitepress'
import C from './constants'

// 页面级 SEO/OG 标签(og:url、og:title、og:description、og:image、twitter:*、
// description、keywords)由 config/head.ts 的 cfgDynamicHead 在构建时按页注入,
// 此处只保留站点级标签。
const head: LocaleSpecificConfig['head'] = [
  ['meta', { property: 'og:site_name', content: C.META_TITLE }],
  ['meta', { property: 'og:locale', content: C.LOCAL_CODE }],
]

export default head
