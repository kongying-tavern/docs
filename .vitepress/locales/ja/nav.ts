import type { DefaultTheme } from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'コミュニティ',
    link: '/community',
    activeMatch: '^/ja/community',
  },
  {
    text: 'スポンサーになる',
    link: '/support-us',
    activeMatch: '^/ja/support-us',
  },
  {
    text: 'アプリ',
    activeMatch: '^/ja/(download-client|manual/)',
    items: [
      {
        text: 'アプリダウンロード',
        link: '/download-client',
        activeMatch: '^/ja/download-client',
      },
      {
        text: 'Windowsアプリ',
        items: [
          {
            text: 'ガイダンス',
            link: '/manual/client',
            activeMatch: '^/ja/manual/',
          },
          {
            text: 'リリースノート',
            link: 'https://support.qq.com/products/321980/blog/505884',
          },
        ],
      },
      {
        text: 'Webアプリ',
        items: [
          {
            text: '今すぐ体験',
            link: 'https://v3.yuanshen.site',
          },
          {
            text: 'リリースノート',
            link: 'https://support.qq.com/products/321980/blog/505810',
          },
        ],
      },
    ],
  },
  {
    text: 'フィードバック',
    items: [
      {
        text: 'フィートバック',
        link: 'https://support.qq.com/products/321980',
      },
      {
        text: 'ご要望',
        link: 'https://support.qq.com/products/321980/topic-detail/2016/',
      },
    ],
  },
  {
    text: 'もっと知る',
    activeMatch:
      '^/ja/(join|team|staff|support-us|credits|disclaimer|privacy|agreement|translations|friends-links)',
    items: [
      {
        text: '私たちを知る',
        items: [
          {
            text: '開発に参画',
            link: '/join',
            activeMatch: '^/ja/join',
          },
          {
            text: 'チームを知る',
            link: '/team',
            activeMatch: '^/ja/team',
          },
        ],
      },
      {
        text: '感謝',
        items: [
          {
            text: '貢献者感謝',
            link: '/staff',
            activeMatch: '^/ja/staff',
          },
          {
            text: '寄付感謝',
            link: '/support-us#sponsor-acknowledgement',
            activeMatch: '^/ja/support-us',
          },
          {
            text: '技術提供',
            link: '/credits',
            activeMatch: '^/ja/credits',
          },
        ],
      },
      {
        text: '法令について',
        items: [
          {
            text: '免責事項',
            link: '/disclaimer',
            activeMatch: '^/ja/disclaimer',
          },
          {
            text: 'プライバシーポリシー',
            link: '/privacy',
            activeMatch: '^/ja/privacy',
          },
          {
            text: '利用規約',
            link: '/agreement',
            activeMatch: '^/ja/agreement',
          },
        ],
      },
      {
        text: 'その他',
        items: [
          {
            text: '翻訳に参加',
            link: '/translations',
            activeMatch: '^/ja/translations',
          },
          {
            text: 'リンク集',
            link: '/friends-links',
            activeMatch: '^/ja/friends-links',
          },
        ],
      },
    ],
  },
]

export default nav
