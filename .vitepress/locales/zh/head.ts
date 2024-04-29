import type { LocaleSpecificConfig } from 'vitepress'
import C from './constants'

const head: LocaleSpecificConfig['head'] = [
  ['meta', { property: 'og:site_name', content: C.META_TITLE }],
  ['meta', { property: 'og:locale', content: C.LOCAL_CODE }],
]

export default head
