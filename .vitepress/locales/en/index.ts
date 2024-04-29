import { baseHelper } from '../../theme/utils'
import { socialList } from '../../theme/composables/socialList'

import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../types'

import C from './constants'
import Nav from './nav'
import Sidebar from './sidebar'
import _404 from './404'

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
    ui: {
      button: {
        submit: 'Submit',
        cancel: 'Cancel',
      },
    },
    docsFeedback: {
      feedbackMsg: 'Was this document helpful?',
      good: 'Yes',
      bad: 'No',
      feedbackFailMsg:
        'Feedback failed, please retry or contact admin (QQ: 1961266616)!',
      feedbackSuccessMsg: 'Feedback submitted successfully, thank you!',
      badFeedbackSuccessMsg: 'Please specify any issues below~',
      form: {
        chooseIssues: 'Did you encounter these issues?',
        translationIssue: 'Translation',
        typosIssue: 'Typos/Punctuation',
        ContentImgLinkIssue: 'Inaccurate Content, Image or Link',
        feedbackDetail: 'Details/Suggestions',
        feedbackTip: 'Describe issues or suggestions here',
        otherIssue: 'Other (specify below)',
        contactWay: 'Contact (optional)',
        issueOptions: [
          { label: 'Page Display Error', value: 'pagedisplay-issue' },
          { label: 'Typos, Punctuation', value: 'typos-issue' },
          { label: 'Content, Image, Link Error', value: 'content-issue' },
          { label: 'Other Issues', value: 'other-issue' },
        ],
      },
    },

    team: {
      title: '关于团队',
      desc: '地图的背后是一个基本来自中国的团队，以下是部分成员的个人信息。',
      coreMember: {
        title: '核心团队成员',
        desc: '核心团队成员是那些积极长期参与维护一个或多个核心项目的人。 他们对空荧酒馆的生态系统做出了重大贡献。',
      },
      emeritiMember: {
        title: '名誉核心团队',
        desc: '我们在此致敬过去曾做出过突出贡献的不再活跃的团队成员。',
      },
      partnerMember: {
        title: '社区伙伴',
        desc: '我们与这些主要合作伙伴建立了更加亲密的关系，经常与他们就即将到来的功能展开合作。',
      },
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kongying-tavern' },
      {
        icon: {
          svg: socialList.reddit.icon,
        },
        link: 'https://www.reddit.com/user/Kongying_Tavern',
      },
      { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
      { icon: 'x', link: 'https://twitter.com/KongyingTavern' },
    ],
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },
    staff: {
      title: 'Staff',
      desc: '空荧酒馆『原神地图』项目参与制作',
      communityStaff: {
        title: '社区运营',
      },
      clientStaff: {
        title: '客户端开发',
      },
      webStaff: {
        title: '网页端开发',
      },
      translateStaff: {
        title: '本地化翻译',
      },
      pinStaff: {
        title: '地图点位标记',
      },
    },
    asideLinks: {
      title: 'Links',
      starOnGitHub: 'Star on GitHub',
      contactUsText: 'Chat on Discord',
      contactUsLink: 'https://discord.gg/SWz6RTWNkm',
      sponsor: 'Become a Sponsor',
      editLink: 'Edit this page',
    },
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
    footer: baseHelper(footer(), C.LOCAL_BASE),
  },
  head: [
    ['meta', { property: 'og:site_name', content: C.META_TITLE }],
    ['meta', { property: 'og:locale', content: 'en-US' }],
  ],
}

function footer(): CustomConfig['footer'] {
  return {
    qrcodeTitle: 'Discord Server',
    qrcodeMessage: 'Contact us on discord',
    qrcodeLink: 'https://discord.gg/aFe57AKZUF',
    navigation: [
      {
        title: 'About',
        items: [
          {
            text: 'Join Us',
            link: '/join',
          },
          {
            text: 'Our team',
            link: '/team',
          },
          {
            text: 'Sponsors',
            link: '/support-us',
          },
        ],
      },
      {
        title: 'Legal (Chinese)',
        items: [
          {
            text: 'Disclaimer',
            link: '/disclaimer',
          },
          {
            text: 'Privacy',
            link: '/privacy',
          },
          {
            text: 'Agreement',
            link: '/agreement',
          },
        ],
      },
      {
        title: 'Support',
        items: [
          {
            text: 'Client User Manual',
            link: '/manual/client-user-manual',
          },
          {
            text: 'Feedback',
            link: 'https://support.qq.com/products/321980',
          },
          {
            text: 'New Features',
            link: 'https://support.qq.com/products/321980/topic-detail/2016/',
          },
        ],
      },
    ],
  }
}
