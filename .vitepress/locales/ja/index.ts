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

export const jaConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  titleTemplate: 'Kongying Tavern',
  themeConfig: {
    keyword: C.META_KEYWORDS,
    description: C.META_DESCRIPTION,
    image: C.META_IMAGE,
    siteTitle: '原神マップ',
    outlineTitle: 'このページでは',
    logo: '/imgs/common/logo/logo_256.png',
    lastUpdatedText: '更新日時',
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
    payment: {
      wechatpay: {
        name: 'WeChat Pay',
        address: 'wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp',
      },
      alipay: {
        name: 'Alipay',
        address: 'https://qr.alipay.com/tsx11609thmpw9odmvdlxd6',
      },
      qqpay: {
        name: 'QQ Pay',
        address:
          'https://i.qianbao.qq.com/wallet/sqrcode.htm?m=tenpay&a=1&u=790489566&ac=CAEQ3tP3-AIY0v2k_AU%3D_xxx_sign&n=AAAAAAAA&f=wallet',
      },
      paypal: {
        name: 'PayPal',
        address: 'https://www.paypal.com/paypalme/yuanshenditu',
      },
      bilibili: {
        name: 'bilibili',
        address: 'https://space.bilibili.com/518076785',
      },
    },

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
  ],
}
