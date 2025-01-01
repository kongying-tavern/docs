import type { CustomConfig } from '../types'

const footer: CustomConfig['footer'] = {
  qrcodeTitle: 'Discordサーバー',
  qrcodeMessage: 'Contact us on discord',
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
          text: 'Our team',
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
          text: 'ユーザマニュアル',
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
