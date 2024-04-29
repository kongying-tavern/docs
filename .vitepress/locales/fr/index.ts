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
    docsFeedback: {
      feedbackMsg: 'Ce document vous a-t-il été utile ?',
      good: 'Utile',
      bad: 'Pas utile',
      feedbackFailMsg:
        "Échec de la rétroaction, veuillez réessayer ou contacter l'administrateur (QQ : 1961266616)!",
      feedbackSuccessMsg: 'Rétroaction soumise avec succès, merci!',
      badFeedbackSuccessMsg: 'Veuillez spécifier les problèmes ci-dessous~',
      form: {
        chooseIssues: "Avez-vous rencontré l'un de ces problèmes?",
        translationIssue: 'Problème de traduction',
        typosIssue: 'Erreurs de frappe/ponctuation',
        ContentImgLinkIssue:
          "Contenu inexact, problème de chargement d'image ou de lien",
        feedbackDetail: 'Détails/Suggestions',
        feedbackTip: 'Décrivez les problèmes rencontrés ou les suggestions ici',
        otherIssue: 'Autres problèmes (spécifiez ci-dessous)',
        contactWay: 'Coordonnées (facultatif)',
        issueOptions: [
          { label: "Erreur d'affichage de page", value: 'pagedisplay-issue' },
          { label: 'Erreurs de frappe, ponctuation', value: 'typos-issue' },
          { label: 'Contenu, image, erreur de lien', value: 'content-issue' },
          { label: 'Autres problèmes', value: 'other-issue' },
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
        ariaLabel: 'Reddit',
      },
      { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
      { icon: 'x', link: 'https://twitter.com/KongyingTavern' },
    ],
    asideLinks: {
      title: 'Links',
      starOnGitHub: 'Star on GitHub',
      contactUsText: 'Chat on Discord',
      contactUsLink: 'https://discord.gg/SWz6RTWNkm',
      sponsor: 'Become a Sponsor',
      editLink: 'Edit this page',
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
    docFooter: {
      prev: 'Page précédente',
      next: 'Page suivante',
    },
    editLink: {
      pattern: 'https://github.com/kongying-tavern/docs/edit/main/src/:path',
      text: 'Suggérer des modifications à cette page',
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
