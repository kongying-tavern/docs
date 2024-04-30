import type { LocaleSpecificConfig } from 'vitepress'
import C from './constants'

const head: LocaleSpecificConfig['head'] = [
  ['meta', { name: 'keywords', content: C.META_KEYWORDS }],
  ['meta', { property: 'og:url', content: C.META_URL }],
  ['meta', { property: 'og:description', content: C.META_DESCRIPTION }],
  ['meta', { property: 'twitter:url', content: C.META_URL }],
  ['meta', { property: 'twitter:title', content: C.META_TITLE }],
  ['meta', { property: 'twitter:description', content: C.META_DESCRIPTION }],
  ['meta', { property: 'og:site_name', content: C.META_TITLE }],
  ['meta', { property: 'og:locale', content: C.LOCAL_CODE }],
  [
    'meta',
    {
      property: 'og:image',
      content: C.META_IMAGE,
    },
  ],
  [
    'meta',
    {
      name: 'twitter:image',
      content: C.META_IMAGE,
    },
  ],
]

export default head
