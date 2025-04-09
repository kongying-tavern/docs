import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../types'
import { baseHelper } from '../../theme/utils'
import _404 from './404'
import AsideLinks from './aside-links'
import Changelog from './changelog'
import C from './constants'
import docReaction from './docs-feedback'
import Footer from './footer'
import Forum from './forum'
import Head from './head'
import Nav from './nav'
import Payment from './payment'
import Sidebar from './sidebar'
import Staff from './staff'

import Team from './team'
import UI from './ui'

export const zhConfig: LocaleSpecificConfig<
  CustomConfig & DefaultTheme.Config
> = {
  title: '空荧酒馆',
  titleTemplate: ':title | 空荧酒馆',
  description: C.META_DESCRIPTION,
  head: Head,
  themeConfig: {
    siteTitle: C.META_TITLE,
    keyword: C.META_KEYWORDS,
    description: C.META_DESCRIPTION,
    image: C.META_IMAGE,
    logo: '/imgs/common/logo/logo_256.png',

    outlineTitle: '本页目录',
    lastUpdatedText: '更新日期',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '更改语言',
    notFound: _404,
    ui: UI,
    asideLinks: AsideLinks,
    docReaction,
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    staff: Staff,
    team: Team,
    payment: Payment,
    forum: Forum,
    changelog: Changelog,
    nav: baseHelper(Nav, C.LOCAL_BASE),
    sidebar: baseHelper(Sidebar, C.LOCAL_BASE),
    footer: baseHelper(Footer, C.LOCAL_BASE),
  },
}
