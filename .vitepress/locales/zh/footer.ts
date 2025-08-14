import type { CustomConfig } from '../types'

const footer: CustomConfig['footer'] = {
  qrcodeTitle: '反馈QQ群',
  qrcodeMessage: '如遇问题欢迎联系我们',
  qrcodeLink: 'https://jq.qq.com/?_wv=1027&k=nbveGrfQ',
  navigation: [
    {
      title: '产品',
      items: [
        {
          text: '客户端使用手册',
          link: '/manual/client/',
        },
        {
          text: '客户端更新日志',
          link: '/blog/hotupdatelog-client',
        },
        {
          text: '网页版更新日志',
          link: '/blog/changelog-web',
        },
      ],
    },
    {
      title: '关于',
      items: [
        {
          text: '加入我们',
          link: '/join',
        },
        {
          text: '团队博客',
          link: './blog',
        },
        {
          text: '赞助鸣谢',
          link: '/support-us',
        },
      ],
    },
    {
      title: '政策',
      items: [
        {
          text: '免责声明',
          link: '/disclaimer',
        },
        {
          text: '隐私政策',
          link: '/privacy',
        },
        {
          text: '用户协议',
          link: '/agreement',
        },
      ],
    },
    {
      title: '更多',
      items: [
        {
          text: '问题反馈',
          link: '/feedback/',
        },
        {
          text: '参与翻译',
          link: '/translations',
        },
        {
          text: '友情链接',
          link: '/friends-links',
        },
      ],
    },
  ],
}

export default footer
