import fs from 'fs'
import path from 'path'

import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from './types'

export const META_URL = 'https://yuanshen.site/docs/ja/'
export const META_TITLE = '原神マップ'
export const META_KEYWORDS =
  '原神マップ, テイワットマップ, 空蛍酒場, yuanshenmap, Genshin Impact Map, Kongying Map'
export const META_DESCRIPTION =
  '空蛍酒場は開発している資源、任務など攻略全般掲載するマップ'

export const jaConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  description: META_DESCRIPTION,
  titleTemplate: 'Kongying Tavern',
  themeConfig: {
    siteTitle: '原神マップ',
    outlineTitle: 'このページでは',
    logo: '/imgs/logo_256.png',
    lastUpdatedText: '更新日時',
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
      prev: '前へ',
      next: '次へ',
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
      text: 'エラー報告',
    },
    nav: [
      {
        text: 'ダウンロード',
        link: 'ja/download-client.md',
      },
      {
        text: 'コミュニティ',
        link: 'ja/community.md',
      },
      {
        text: 'Support us',
        link: 'ja/support-us.md',
      },
      {
        text: 'フィードバック',
        items: [
          {
            text: 'マニュアル',
            link: 'ja/manual/client-user-manual.md',
          },
          {
            text: 'フィートバック',
            link: 'https://support.qq.com/products/321980',
          },
          {
            text: '機能紹介',
            link: 'https://support.qq.com/products/321980/faqs-more/?id=126362',
          },
          {
            text: 'ご要望',
            link: 'https://support.qq.com/products/321980/topic-detail/2016/',
          },
        ],
      },
      {
        text: 'もっと知る',
        items: [
          {
            text: '私たちを知る',
            items: [
              {
                text: '開発に参画',
                link: 'ja/join.md',
              },
              {
                text: 'チームを知る',
                link: 'ja/team.md',
              },
            ],
          },
          {
            text: 'アップデートログ',
            items: [
              {
                text: 'Web版',
                link: 'https://support.qq.com/products/321980/blog/505810',
              },
              {
                text: 'Windows版',
                link: 'https://support.qq.com/products/321980/blog/772498',
              },
            ],
          },
          {
            text: '感謝',
            items: [
              {
                text: '技術提供',
                link: 'ja/credits.md',
              },
              {
                text: '貢献者感謝',
                link: 'ja/contribution.md',
              },
              {
                text: '寄付感謝',
                link: 'ja/support-us.md#Sponsor%20Acknowledgements',
              },
            ],
          },
          {
            text: '法令について',
            items: [
              {
                text: '免責事項',
                link: 'ja/disclaimer.md',
              },
              {
                text: 'プライバシーポリシー',
                link: 'ja/privacy.md',
              },
              {
                text: '利用規約',
                link: 'ja/agreement.md',
              },
            ],
          },
          {
            text: 'その他',
            items: [
              {
                text: 'リンク集',
                link: 'ja/friends-links.md',
              },
            ],
          },
        ],
      },
    ],
    sidebar: {
      'ja/manual': [
        {
          text: '目次',
          link: 'ja/manual/client-user-manual',
        },
        {
          text: '使い方ガイド',
          items: [
            {
              text: '【オートトラッキング】',
              items: [
                {
                  text: '機能紹介',
                  link: 'ja/manual/guide/auto-tracking/importantnotes',
                },
                {
                  text: 'トラブルシューティング',
                  link: 'ja/manual/guide/auto-tracking/troubleshoot',
                },
              ],
            },
            {
              text: '【バックグラウンドユーセージ】フレームレート設定',
              link: 'ja/manual/guide/bg/bgfrate',
            },
            {
              text: '【一括選択】利用ガイド',
              link: 'ja/manual/guide/batch-selection/instructions',
            },
            {
              text: '【キャンバス】ルート計画機能紹介',
              link: 'ja/manual/guide/canvas/guide',
            },
            {
              text: '【おまけ】金リンゴ群島を見る',
              link: 'ja/manual/guide/easter-egg/view',
            },
            {
              text: '【表示】/【非表示】マーカー',
              link: 'ja/manual/guide/hide-show-done/hidedoneshowdone',
            },
            {
              text: '【オーバーレイモード】',
              items: [
                {
                  text: '利用ガイド',
                  link: 'ja/manual/guide/overlay-mode/instructions',
                },
                {
                  text: '【ウィンドウ全画面】ゲーム起動',
                  link: 'ja/manual/guide/overlay-mode/fullscreen-windowed/launching',
                },
              ],
            },
            {
              text: '【セーブデータ】データ復元',
              link: 'ja/manual/guide/restore-recover/progress',
            },
          ],
        },
        {
          text: 'よくある質問',
          items: [
            {
              text: 'ゲームアカウントが凍結される可能性は？',
              link: 'ja/manual/faq/accountsafety/acntban.md',
            },
            {
              text: '【自動更新】自動更新されない',
              link: 'ja/manual/faq/autoupdate/updater.md',
            },
            {
              text: '【インストールできない】',
              items: [
                {
                  text: 'エラーコード 2503',
                  link: 'ja/manual/faq/instlerror/code2503.md',
                },
                {
                  text: '【インストールできない】.dll がないため',
                  link: 'ja/manual/faq/instlerror/missingdll.md',
                },
              ],
            },
            {
              text: '【アプリ開かない】',
              items: [
                {
                  text: '画面真っ白またはプログレスバーが止まる',
                  link: 'ja/manual/faq/launcherror/emptydialog.md',
                },
                {
                  text: '「データクエリ失敗」「バージョンチェック失敗」',
                  link: 'ja/manual/faq/launcherror/versioncheck.md',
                },
              ],
            },
            {
              text: 'ログイン',
              items: [
                {
                  text: '【ログインできない】ログイン方法',
                  link: 'ja/manual/faq/login/accountlogin.md',
                },
                {
                  text: '【毎回ログインを求められる】',
                  link: 'ja/manual/faq/login/clientrepeatedly.md',
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      qrcodeTitle: 'Discordサーバー',
      qrcodeMessage: 'Contact us on discord',
      qrcodeLink: 'https://discord.gg/aFe57AKZUF',
      navigation: [
        {
          title: '私たちについて',
          items: [
            {
              text: '仲間になる',
              link: 'ja/join',
            },
            {
              text: 'Our team',
              link: 'ja/team',
            },
            {
              text: 'スポンサー',
              link: 'ja/support-us',
            },
          ],
        },
        {
          title: '法令について',
          items: [
            {
              text: '免責事項',
              link: 'ja/disclaimer',
            },
            {
              text: 'プライバシーポリシー',
              link: 'ja/privacy',
            },
            {
              text: '利用規約',
              link: 'ja/agreement',
            },
          ],
        },
        {
          title: 'サポート',
          items: [
            {
              text: 'ユーザマニュアル',
              link: 'ja/manual/client-user-manual',
            },
            {
              text: 'フィードバック',
              link: 'https://support.qq.com/products/321980',
            },
            {
              text: '新機能',
              link: 'https://support.qq.com/products/321980/topic-detail/2016/',
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
    [
      'meta',
      {
        property: 'og:image',
        content: `https://yuanshen.site/docs/imgs/cover.jpg`,
      },
    ],
    [
      'meta',
      {
        name: 'twitter:image',
        content: `https://yuanshen.site/docs/imgs/cover.jpg`,
      },
    ],
  ],
}
