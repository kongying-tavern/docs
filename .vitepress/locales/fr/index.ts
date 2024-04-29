import { baseHelper } from '../../theme/utils'

import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../types'

import C from './constants'
import Nav from './nav'
import Sidebar from './sidebar'
import Footer from './footer'
import _404 from './404'
import UI from './ui'
import SocialLinks from './social-links'
import AsideLinks from './aside-links'
import DocsFeedback from './docs-feedback'

import Staff from './staff'
import Team from './team'
import Payment from './payment'

export const frConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  titleTemplate: 'Kongying Tavern',
  themeConfig: {
    keyword: C.META_KEYWORDS,
    description: C.META_DESCRIPTION,
    image: C.META_IMAGE,
    siteTitle: 'Carte interactive de Genshin',
    outlineTitle: 'Sur cette page',
    logo: '/imgs/common/logo/logo_256.png',
    lastUpdatedText: 'Dernière mise à jour ',
    notFound: _404,
    ui: UI,
    socialLinks: SocialLinks,
    asideLinks: AsideLinks,
    docsFeedback: DocsFeedback,
    docFooter: {
      prev: 'Page précédente',
      next: 'Page suivante',
    },

    staff: Staff,
    team: Team,
    payment: Payment,

    nav: baseHelper(Nav, C.LOCAL_BASE),
    sidebar: baseHelper(Sidebar, C.LOCAL_BASE),
    footer: baseHelper(Footer, C.LOCAL_BASE),
  },
  head: [
    ['meta', { name: 'keywords', content: C.META_KEYWORDS }],
    ['meta', { property: 'og:url', content: C.META_URL }],
    ['meta', { property: 'og:description', content: C.META_DESCRIPTION }],
    ['meta', { property: 'twitter:url', content: C.META_URL }],
    ['meta', { property: 'twitter:title', content: C.META_TITLE }],
    ['meta', { property: 'twitter:description', content: C.META_DESCRIPTION }],
    ['meta', { property: 'og:site_name', content: C.META_TITLE }],
    ['meta', { property: 'og:locale', content: C.LOCAL_CODE }],
    ['meta', { property: 'og:image', content: C.META_IMAGE }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: C.META_IMAGE,
      },
    ],
  ],
}
