import type { CustomConfig } from '../types'

const footer: CustomConfig['footer'] = {
  qrcodeTitle: '开发反馈群',
  qrcodeMessage: '欢迎QQ扫码联系我们',
  qrcodeLink: 'https://jq.qq.com/?_wv=1027&k=nbveGrfQ',
  navigation: [
    {
      title: '关于',
      items: [
        {
          text: '加入我们',
          link: '/join',
        },
        {
          text: '赞助鸣谢',
          link: '/support-us',
        },
        {
          text: '友情链接',
          link: '/friends-links',
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
      title: '产品',
      items: [
        {
          text: '客户端使用手册',
          link: '/manual/client/',
        },
        {
          text: '客户端更新日志',
          link: '/changelog/windows-clinet',
        },
        {
          text: '网页版更新日志',
          link: '/changelog/web',
        },
      ],
    },
  ],
}

export default footer
