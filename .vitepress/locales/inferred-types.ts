import type { DefaultTheme, HeadConfig } from 'vitepress'
import type zhJsonData from './json/zh.json'
import type { ConvertSerializedRegex } from './utils/regexConverter'

// 首先转换序列化的正则表达式
type ConvertedZhData = ConvertSerializedRegex<typeof zhJsonData>

// 然后正确处理 VitePress 特定字段的类型
type InferredZhData = Omit<ConvertedZhData, 'head' | 'footer'> & {
  head: HeadConfig[]
  footer: ConvertedZhData['footer'] // 保持 footer 的原始推断类型用于自定义配置
}

// 从推断的中文数据中提取 CustomConfig 类型，保持原有名称以兼容其他地方
export interface CustomConfig {
  // 基础配置
  siteTitle: InferredZhData['siteTitle']
  keyword: InferredZhData['keyword']
  image: InferredZhData['image']
  logo: InferredZhData['logo']

  // Footer 配置
  footer: InferredZhData['footer']

  // UI 配置
  ui: InferredZhData['ui']

  // 页面链接
  asideLinks: InferredZhData['asideLinks']

  // 文档配置
  docReaction: InferredZhData['docReaction']
  docFooter: InferredZhData['docFooter']

  // 团队和人员
  staff: InferredZhData['staff']
  team: InferredZhData['team']

  // 支付配置
  payment: InferredZhData['payment']

  // 论坛配置
  forum: InferredZhData['forum']

  // 更新日志
  changelog: InferredZhData['changelog']
}

// 完整的主题配置类型，结合 VitePress 默认主题和自定义配置
export type ThemeConfig = DefaultTheme.Config & CustomConfig
