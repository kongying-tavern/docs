import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../types'
import { baseHelper } from '../../theme/utils'
import _404 from './404'
import AsideLinks from './aside-links'
import Changelog from './changelog'
import C from './constants'
import docReaction from './docs-reaction'
import Footer from './footer'
import Forum from './forum'
import Head from './head'
import Nav from './nav'
import Payment from './payment'
import Sidebar from './sidebar'
import Staff from './staff'

import Team from './team'
import UI from './ui'

export const enConfig: LocaleSpecificConfig<
  CustomConfig & DefaultTheme.Config
> = {
  title: 'Kongying Tavern',
  titleTemplate: ':title | Kongying Tavern',
  description: C.META_DESCRIPTION,
  head: Head,
  themeConfig: {
    siteTitle: C.META_TITLE,
    keyword: C.META_KEYWORDS,
    description: C.META_DESCRIPTION,
    image: C.META_IMAGE,
    logo: '/imgs/common/logo/logo_256.png',

    outlineTitle: 'On This Page',
    lastUpdatedText: 'Update Date',
    returnToTopLabel: 'Back to Top',
    langMenuLabel: 'Change language',
    notFound: _404,
    ui: UI,
    asideLinks: AsideLinks,
    docReaction,
    forum: Forum,
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },

    staff: Staff,
    team: Team,
    payment: Payment,
    changelog: Changelog,

    nav: baseHelper(Nav, C.LOCAL_BASE),
    sidebar: baseHelper(Sidebar, C.LOCAL_BASE),
    footer: baseHelper(Footer, C.LOCAL_BASE),
  },
}
