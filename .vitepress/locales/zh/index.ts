import { baseHelper } from '../../theme/utils'
import { socialList } from '../../theme/composables/socialList'

import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../types'

import C from './constants'
import Nav from './nav'
import Sidebar from './sidebar'
import Footer from './footer'
import _404 from './404'
import UI from './ui'

export const zhConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  titleTemplate: '空荧酒馆',
  description: C.META_DESCRIPTION,
  head: [
    ['meta', { property: 'og:site_name', content: C.META_TITLE }],
    ['meta', { property: 'og:locale', content: C.LOCAL_CODE }],
  ],
  themeConfig: {
    siteTitle: '原神地图',
    keyword: C.META_KEYWORDS,
    description: C.META_DESCRIPTION,
    image: C.META_IMAGE,
    outlineTitle: '本页目录',
    logo: '/imgs/common/logo/logo_256.png',
    lastUpdatedText: '更新日期',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '更改语言',
    notFound: _404,
    ui: UI,
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
      { icon: 'github', link: 'https://github.com/kongying-tavern/' },
      { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
      { icon: 'x', link: 'https://twitter.com/KongyingTavern' },
      {
        icon: {
          svg: socialList.bilibili.icon,
        },
        link: 'https://space.bilibili.com/518076785',
        ariaLabel: 'bilibili',
      },
    ],
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    asideLinks: {
      title: '快捷链接',
      starOnGitHub: 'Star on GitHub',
      contactUsText: '加入Discord服务器',
      contactUsLink: 'https://discord.gg/SWz6RTWNkm',
      sponsor: '支持我们',
      editLink: '报告页面错误',
    },
    docsFeedback: {
      feedbackMsg: '这篇文档是否对你有帮助？',
      good: '有帮助',
      bad: '无帮助',
      feedbackFailMsg: '反馈失败，请重试或联系管理员（QQ：1961266616）！',
      feedbackSuccessMsg: '提交成功，感谢你的反馈！',
      badFeedbackSuccessMsg: '希望你能在下方告知我们具体问题~',
      form: {
        chooseIssues: '是否遇到以下问题？',
        translationIssue: '翻译问题',
        typosIssue: '错别字/标点符号',
        ContentImgLinkIssue: '文案表达不准确、图片加载失败或链接错误',
        feedbackDetail: '反馈内容/更多建议',
        feedbackTip: '请详细描述你在使用文档过程中遇到的问题或优化建议',
        otherIssue: '其他问题（请在反馈内容中具体描述）',
        contactWay: '联系方式（可选）',
        issueOptions: [
          { label: '页面显示错误', value: 'pagedisplay-issue' },
          { label: '错别字、标点符号错误', value: 'typos-issue' },
          { label: '内容表达有误、图片/文字链接错误', value: 'content-issue' },
          { label: '其他问题', value: 'other-issue' },
        ],
      },
    },
    payment: {
      wechatpay: {
        name: '微信支付',
        address: 'wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp',
      },
      alipay: {
        name: '支付宝',
        address: 'https://qr.alipay.com/tsx11609thmpw9odmvdlxd6',
      },
      qqpay: {
        name: 'QQ 支付',
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
}
