import { baseHelper } from '../../theme/utils'

import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../types'

import C from './constants'
import Head from './head'
import Nav from './nav'
import Sidebar from './sidebar'
import Footer from './footer'
import _404 from './404'
import UI from './ui'
import QA from './qa'
import SocialLinks from './social-links'
import AsideLinks from './aside-links'
import DocsFeedback from './docs-feedback'

import Staff from './staff'
import Team from './team'
import Payment from './payment'

export const enConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
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
    returnToTopLabel: '回到顶部',
    langMenuLabel: '更改语言',
    notFound: _404,
    ui: UI,
    qa: QA,
    socialLinks: SocialLinks,
    asideLinks: AsideLinks,
    docsFeedback: DocsFeedback,
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },

    staff: Staff,
    team: Team,
    payment: Payment,

    nav: baseHelper(Nav, C.LOCAL_BASE),
    sidebar: baseHelper(Sidebar, C.LOCAL_BASE),
    footer: baseHelper(Footer, C.LOCAL_BASE),
  },
}
