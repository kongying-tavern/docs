import type { LocaleConfigShape } from '../types'
import C from './constants'

export const jaConfig = {
  title: '空蛍酒場',
  titleTemplate: ':title | 空蛍酒場',
  themeConfig: {
    outline: { label: 'このページでは' },
    lastUpdated: { text: '更新日時' },
    returnToTopLabel: '回到顶部',
    langMenuLabel: '更改语言',
    docFooter: {
      prev: '前へ',
      next: '次へ',
    },
  },
} satisfies LocaleConfigShape

export const label = '日本語'
export const lang = C.LOCAL_CODE
