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
import SocialLinks from './social-links'
import AsideLinks from './aside-links'
import DocsFeedback from './docs-feedback'

import Staff from './staff'
import Team from './team'
import Payment from './payment'

export const jaConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  titleTemplate: 'Kongying Tavern',
  head: Head,
  themeConfig: {
    siteTitle: '原神マップ',
    keyword: C.META_KEYWORDS,
    description: C.META_DESCRIPTION,
    image: C.META_IMAGE,
    logo: '/imgs/common/logo/logo_256.png',

    outlineTitle: 'このページでは',
    lastUpdatedText: '更新日時',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '更改语言',
    notFound: _404,
    ui: UI,
    socialLinks: SocialLinks,
    asideLinks: AsideLinks,
    docsFeedback: DocsFeedback,
    docFooter: {
      prev: '前へ',
      next: '次へ',
    },

    staff: Staff,
    team: Team,
    payment: Payment,

    nav: baseHelper(Nav, C.LOCAL_BASE),
    sidebar: baseHelper(Sidebar, C.LOCAL_BASE),
    footer: baseHelper(Footer, C.LOCAL_BASE),
  },
}
