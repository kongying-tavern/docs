import type { LocaleConfigShape } from '../types.ts'
import C from './constants.ts'

export const jaConfig = {
  title: '空蛍酒場',
  titleTemplate: ':title | 空蛍酒場',
  markdown: {
    codeCopyButton: { tooltipText: 'コードをコピー', copiedText: 'コピーしました' },
  },
  themeConfig: {
    outline: { label: 'このページでは' },
    lastUpdated: { text: '更新日時' },
    returnToTopLabel: '先頭に戻る',
    langMenuLabel: '言語を変更',
    docFooter: {
      prev: '前へ',
      next: '次へ',
    },
  },
} satisfies LocaleConfigShape

export const label = '日本語'
export const lang = C.LOCAL_CODE
