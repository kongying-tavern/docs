import fs from 'fs'
import path from 'path'

import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from './types'

const base = process.env.BASE || 'kr/docs/'
export const META_URL = 'https://yuanshen.site/docs/kr/'
export const META_TITLE = 'Genshin Interactive Map'
export const META_KEYWORDS =
  'Genshin Interactive Map, Genshin Map, Kongying Tavern, yuanshenmap, Genshin Impact Map, Kongying Map'
export const META_DESCRIPTION =
  'A Genshin interactive map by Kongying Tavern for completionists'

export const krConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  description: META_DESCRIPTION,
  themeConfig: {
    siteTitle: 'Genshin Interactive Map',
    outlineTitle: 'On This Page',
    logo: 'kr/imgs/logo_256.png',
    lastUpdatedText: 'Last updated',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kongying-tavern' },
      {
        icon: {
          svg: fs.readFileSync(
            path.resolve(__dirname, '../../src/public/svg/reddit.svg'),
            'utf8'
          ),
        },
        link: 'https://www.reddit.com/user/Kongying_Tavern',
      },
      { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
      { icon: 'twitter', link: 'https://twitter.com/KongyingTavern' },
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
    editLink: {
      pattern: 'https://github.com/kongying-tavern/docs/edit/next/src/:path',
      text: '报告错误',
    },
    nav: [
      {
        text: '客户端下载',
        link: 'kr/download-client.md',
      },
      {
        text: '加入社区',
        link: 'kr/community.md',
      },
      {
        text: '支持我们',
        link: 'kr/support-us.md',
      },
      {
        text: '帮助和反馈',
        items: [
          {
            text: '客户端使用手册',
            link: 'kr/manual/client-user-manual.md',
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
                link: 'kr/join.md',
              },
              {
                text: '了解团队',
                link: 'kr/team.md',
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
                link: 'kr/credits.md',
              },
              {
                text: '贡献鸣谢',
                link: 'kr/contribution.md',
              },
              {
                text: '赞助鸣谢',
                link: 'kr/support-us.md#赞助鸣谢',
              },
            ],
          },
          {
            text: '法律相关',
            items: [
              {
                text: '免责声明',
                link: 'kr/disclaimer.md',
              },
              {
                text: '隐私政策',
                link: 'kr/privacy.md',
              },
              {
                text: '用户协议',
                link: 'kr/agreement.md',
              },
            ],
          },
          {
            text: '其他',
            items: [
              {
                text: '友情链接',
                link: 'kr/friends-links.md',
              },
            ],
          },
        ],
      },
    ],
    sidebar: {
      'kr/manual': [
        {
          text: '目录',
          link: 'kr/manual/client-user-manual',
        },
        {
          text: '使用帮助',
          items: [
            {
              text: '【自动追踪】',
              items: [
                {
                  text: '功能介绍',
                  link: 'kr/manual/guide/auto-tracking/importantnotes',
                },
                {
                  text: '疑难解答',
                  link: 'kr/manual/guide/auto-tracking/troubleshoot',
                },
              ],
            },
            {
              text: '【地图性能占用高】前后台帧率设置',
              link: 'kr/manual/guide/bg/bgfrate',
            },
            {
              text: '【批量选择】使用说明',
              link: 'kr/manual/guide/batch-selection/instructions',
            },
            {
              text: '【画板】路线功能 教程',
              link: 'kr/manual/guide/canvas/guide',
            },
            {
              text: '【彩蛋】查看历史版本金苹果群岛',
              link: 'kr/manual/guide/easter-egg/view',
            },
            {
              text: '【隐藏】标记/【显示】标记',
              link: 'kr/manual/guide/hide-show-done/hidedoneshowdone',
            },
            {
              text: '【覆盖模式】',
              items: [
                {
                  text: '使用说明',
                  link: 'kr/manual/guide/overlay-mode/instructions',
                },
                {
                  text: '【窗口全屏】启动游戏',
                  link: 'kr/manual/guide/overlay-mode/fullscreen-windowed/launching',
                },
              ],
            },
            {
              text: '【存档丢失】存档还原/误删恢复',
              link: 'kr/manual/guide/restore-recover/progress',
            },
          ],
        },
        {
          text: '常见问题',
          items: [
            {
              text: '使用地图客户端会被封号吗？',
              link: 'kr/manual/faq/accountsafety/acntban.md',
            },
            {
              text: '【自动更新】没有反应',
              link: 'kr/manual/faq/autoupdate/updater.md',
            },
            {
              text: '安装错误',
              items: [
                {
                  text: '错误码 2503',
                  link: 'kr/manual/faq/instlerror/code2503.md',
                },
                {
                  text: '【无法安装】提示缺乏 dll 文件',
                  link: 'kr/manual/faq/instlerror/missingdll.md',
                },
              ],
            },
            {
              text: '【无法打开】',
              items: [
                {
                  text: '空窗提示或卡进度条',
                  link: 'kr/manual/faq/launcherror/emptydialog.md',
                },
                {
                  text: '“数据查询失败”、“版本查询失败”',
                  link: 'kr/manual/faq/launcherror/versioncheck.md',
                },
              ],
            },
            {
              text: '登录',
              items: [
                {
                  text: '【不能登录】如何登录',
                  link: 'kr/manual/faq/login/accountlogin.md',
                },
                {
                  text: '【每次打开都需重新登陆】',
                  link: 'kr/manual/faq/login/clientrepeatedly.md',
                },
              ],
            },
          ],
        },
      ],
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
              link: 'kr/join',
            },
            {
              text: '赞助鸣谢',
              link: 'kr/support-us',
            },
            {
              text: '友情链接',
              link: 'kr/friends-links',
            },
          ],
        },
        {
          title: '政策',
          items: [
            {
              text: '免责声明',
              link: 'kr/disclaimer',
            },
            {
              text: '隐私政策',
              link: 'kr/privacy',
            },
            {
              text: '用户协议',
              link: 'kr/agreement',
            },
          ],
        },
        {
          title: '产品',
          items: [
            {
              text: '客户端使用手册',
              link: 'kr/manual/client-user-manual.md',
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
  },
  head: [
    ['meta', { name: 'keywords', content: META_KEYWORDS }],
    ['meta', { property: 'og:url', content: META_URL }],
    ['meta', { property: 'og:description', content: META_DESCRIPTION }],
    ['meta', { property: 'twitter:url', content: META_URL }],
    ['meta', { property: 'twitter:title', content: META_TITLE }],
    ['meta', { property: 'twitter:description', content: META_DESCRIPTION }],
    ['meta', { property: 'og:site_name', content: META_TITLE }],
    ['meta', { property: 'og:locale', content: 'en-US' }],
    ['meta', { property: 'og:image', content: `${base}/imgs/cover.jpg` }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: `${base}/imgs/cover.jpg`,
      },
    ],
  ],
}
