import type { LocaleConfigShape } from '../types'
import C from './constants'

export const zhConfig = {
  title: '空荧酒馆',
  titleTemplate: ':title | 空荧酒馆',
  themeConfig: {
    outlineTitle: '本页目录',
    lastUpdatedText: '更新日期',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '更改语言',
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },
} satisfies LocaleConfigShape

export const label = '简体中文'
export const lang = C.LOCAL_CODE
