import type { LocaleConfigShape } from '../types'
import C from './constants'

export const enConfig = {
  title: 'Kongying Tavern',
  titleTemplate: ':title | Kongying Tavern',
  themeConfig: {
    outlineTitle: 'On This Page',
    lastUpdatedText: 'Update Date',
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
