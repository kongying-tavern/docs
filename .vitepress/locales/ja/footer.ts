import type { CustomConfig } from '../types.ts'

const footer: CustomConfig['footer'] = {
  qrcodeTitle: 'Discordサーバー',
  qrcodeAlt: 'Discord 招待 QR コード',
  qrcodeMessage: 'お気軽にご連絡ください',
  qrcodeLink: 'https://discord.gg/aFe57AKZUF',
  navigation: [
    {
      title: '私たちについて',
      items: [
        {
          text: '仲間になる',
          link: '/join',
        },
        {
          text: 'チーム紹介',
          link: '/team',
        },
        {
          text: 'スポンサー',
          link: '/support-us',
        },
      ],
    },
    {
      title: '法令について',
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
      title: 'サポート',
      items: [
        {
          text: 'ユーザーマニュアル',
          link: '/manual/client/',
        },
        {
          text: 'フィードバック',
          link: '/feedback/',
        },
        // {
        //   text: '新機能',
        //   link: 'https://support.qq.com/products/321980/topic-detail/2016/',
        // },
      ],
    },
  ],
}

export default footer
