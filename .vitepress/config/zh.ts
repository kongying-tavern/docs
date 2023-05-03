import fs from 'fs'
import path from 'path'
import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from './types'

const base = process.env.BASE || '/docs'
export const META_URL = 'https://yuanshen.site/docs/'
export const META_TITLE = '原神地图'
export const META_DESCRIPTION = '空荧酒馆制作的原神全资源攻略地图。'
export const META_KEYWORDS =
  '原神地图, 空荧地图, 空荧酒馆原神地图, 空荧酒馆, 原神资源, yuanshen, Kongying Tavern'

export const zhConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  description: META_DESCRIPTION,
  head: [
    ['meta', { name: 'keywords', content: META_KEYWORDS }],
    ['meta', { property: 'og:url', content: META_URL }],
    ['meta', { property: 'og:description', content: META_DESCRIPTION }],
    ['meta', { property: 'twitter:url', content: META_URL }],
    ['meta', { property: 'twitter:title', content: META_TITLE }],
    ['meta', { property: 'og:site_name', content: META_TITLE }],
    ['meta', { property: 'twitter:description', content: META_DESCRIPTION }],
    ['meta', { property: 'og:locale', content: 'zh-CN' }],
    ['meta', { property: 'og:image', content: `${base}/imgs/cover.jpg` }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: `${base}/imgs/cover.jpg`,
      },
    ],
  ],
  themeConfig: {
    siteTitle: '原神地图',
    outlineTitle: '本页目录',
    logo: '/imgs/logo_256.png',
    lastUpdatedText: '更新日期',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '更改语言',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kongying-tavern/' },
      { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
      { icon: 'twitter', link: 'https://twitter.com/KongyingTavern' },
      {
        icon: {
          svg: fs.readFileSync(
            path.resolve(__dirname, '../../src/public/svg/qq-fill.svg'),
            'utf8'
          ),
        },
        link: 'https://qm.qq.com/cgi-bin/qm/qr?k=qDLY3l2-A_zf2AW73X5S5PHuHcjicVbf&jump_from=webapi',
      },
    ],

    docFooter: {
      prev: '上一页',
      next: '下一页',
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
        name: 'Paypal',
        address: 'https://www.paypal.com/paypalme/yuanshenditu',
      },
      bilibili: {
        name: 'bilibili',
        address: 'https://space.bilibili.com/518076785',
      },
    },
    footer: {
      qrcodeTitle: '开发反馈群',
      qrcodeMessage: '欢迎QQ扫码联系我们',
      qrcodeLink: 'https://jq.qq.com/?_wv=1027&k=nbveGrfQ',
      navigation: [
        {
          title: '关于',
          items: [
            {
              text: '加入我们',
              link: './join',
            },
            {
              text: '了解团队',
              link: './team',
            },
            {
              text: '赞助鸣谢',
              link: './support-us',
            },
          ],
        },
        {
          title: '政策',
          items: [
            {
              text: '免责声明',
              link: './disclaimer',
            },
            {
              text: '隐私政策',
              link: './privacy',
            },
            {
              text: '用户协议',
              link: './agreement',
            },
          ],
        },
        {
          title: '产品',
          items: [
            {
              text: '客户端使用手册',
              link: 'https://support.qq.com/products/321980/faqs/94938',
            },
            {
              text: '客户端更新日志',
              link: 'https://support.qq.com/products/321980/blog/505884',
            },
            {
              text: '网页版更新日志',
              link: 'https://support.qq.com/products/321980/blog/505810',
            },
          ],
        },
      ],
    },
    editLink: {
      pattern: 'https://github.com/kongying-tavern/docs/edit/next/src/:path',
      text: '报告错误',
    },

    nav: [
      {
        text: '客户端下载',
        link: './download-client.md',
      },
      {
        text: '加入社区',
        link: './community.md',
      },
      {
        text: '支持我们',
        link: './support-us.md',
      },
      {
        text: '帮助和反馈',
        items: [
          {
            text: '客户端使用手册',
            link: 'https://support.qq.com/products/321980/faqs-more/?id=94938',
          },
          {
            text: '问题反馈',
            link: 'https://support.qq.com/products/321980',
          },
          {
            text: '功能介绍',
            link: 'https://support.qq.com/products/321980/faqs-more/?id=126362',
          },
          {
            text: '功能投票',
            link: 'https://support.qq.com/products/321980/topic-detail/2016/',
          },
        ],
      },
      {
        text: '了解更多',
        items: [
          {
            text: '了解我们',
            items: [
              {
                text: '加入我们',
                link: './join.md',
              },
              {
                text: '了解团队',
                link: './team.md',
              },
            ],
          },
          {
            text: '更新日志',
            items: [
              {
                text: '网页端',
                link: 'https://support.qq.com/products/321980/blog/505810',
              },
              {
                text: '客户端',
                link: 'https://support.qq.com/products/321980/blog/772498',
              },
            ],
          },
          {
            text: '鸣谢',
            items: [
              {
                text: '技术鸣谢',
                link: './credits.md',
              },
              {
                text: '贡献鸣谢',
                link: './contribution.md',
              },
              {
                text: '赞助鸣谢',
                link: './support-us.md#赞助鸣谢',
              },
            ],
          },
          {
            text: '法律相关',
            items: [
              {
                text: '免责声明',
                link: './disclaimer.md',
              },
              {
                text: '隐私政策',
                link: './privacy.md',
              },
              {
                text: '用户协议',
                link: './agreement.md',
              },
            ],
          },
        ],
      },
    ],
  },
}
