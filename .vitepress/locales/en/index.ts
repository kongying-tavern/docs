import type { LocaleConfigShape } from '../types.ts'
import C from './constants.ts'

export const enConfig = {
  title: 'Kongying Tavern',
  titleTemplate: ':title | Kongying Tavern',
  markdown: {
    codeCopyButton: { tooltipText: 'Copy code', copiedText: 'Copied' },
  },
  themeConfig: {
    outline: { label: 'On This Page' },
    lastUpdated: { text: 'Update Date' },
    returnToTopLabel: 'Back to Top',
    langMenuLabel: 'Change language',
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },
  },
} satisfies LocaleConfigShape

export const label = 'English'
export const lang = C.LOCAL_CODE
