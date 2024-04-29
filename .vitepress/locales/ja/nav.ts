import type { DefaultTheme } from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'アプリ',
    items: [
      {
        text: 'アプリダウンロード',
        link: '/download-client',
      },
      {
        text: 'Windowsアプリ',
        items: [
          {
            text: 'ガイダンス',
            link: '/manual/client-user-manual',
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
    text: 'コミュニティ',
    link: '/community',
  },
  {
    text: 'スポンサーになる',
    link: '/support-us',
  },
  {
    text: 'フィードバック',
    items: [
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
            link: '/join',
          },
          {
            text: 'チームを知る',
            link: '/team',
          },
        ],
      },
      {
        text: '感謝',
        items: [
          {
            text: '技術提供',
            link: '/credits',
          },
          {
            text: '貢献者感謝',
            link: '/contribution',
          },
          {
            text: '寄付感謝',
            link: '/support-us#sponsor-acknowledgement',
          },
        ],
      },
      {
        text: '法令について',
        items: [
          {
            text: '免責事項',
            link: '/disclaimer',
          },
          {
            text: 'プライバシーポリシー',
            link: '/privacy',
          },
          {
            text: '利用規約',
            link: '/agreement',
          },
        ],
      },
      {
        text: 'その他',
        items: [
          {
            text: 'リンク集',
            link: '/friends-links',
          },
        ],
      },
    ],
  },
]

export default nav
