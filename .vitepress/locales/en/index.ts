import { baseHelper } from '../../theme/utils'

import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../types'

import C from './constants'
import Nav from './nav'
import Sidebar from './sidebar'
import _404 from './404'
import UI from './ui'
import SocialLinks from './social-links'
import AsideLinks from './aside-links'
import DocsFeedback from './docs-feedback'
import Staff from './staff'
import Team from './team'

export const enConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  titleTemplate: 'Kongying Tavern',
  themeConfig: {
    keyword: C.META_KEYWORDS,
    description: C.META_DESCRIPTION,
    image: C.META_IMAGE,
    siteTitle: 'Genshin Interactive Map',
    outlineTitle: 'On This Page',
    lastUpdatedText: 'Update Date',
    logo: '/imgs/common/logo/logo_256.png',
    notFound: _404,
    ui: UI,
    socialLinks: SocialLinks,
    asideLinks: AsideLinks,
    docsFeedback: DocsFeedback,
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
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
    ['meta', { property: 'og:site_name', content: C.META_TITLE }],
    ['meta', { property: 'og:locale', content: 'en-US' }],
  ],
}
