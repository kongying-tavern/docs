import type { DefaultTheme } from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
  {
    text: '加入社区',
    link: '/community',
  },
  {
    text: '支持我们',
    link: '/support-us',
  },
  {
    text: '地图工具',
    items: [
      {
        text: '下载客户端',
        link: '/download-client',
      },
      {
        text: 'Windows客户端',
        items: [
          {
            text: '使用手册',
            link: '/manual/client',
          },
          {
            text: '更新日志',
            link: 'https://support.qq.com/products/321980/blog/505884',
          },
        ],
      },
      {
        text: '地图网页版',
        items: [
          {
            text: '立即体验',
            link: 'https://v3.yuanshen.site',
          },
          {
            text: '更新日志',
            link: 'https://support.qq.com/products/321980/blog/505810',
          },
        ],
      },
    ],
  },
  {
    text: '帮助和反馈',
    items: [
      {
        text: '问题反馈',
        link: 'https://support.qq.com/products/321980',
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
            link: '/join',
          },
          {
            text: '了解团队',
            link: '/team',
          },
        ],
      },
      {
        text: '鸣谢',
        items: [
          {
            text: '制作人员',
            link: '/staff',
          },
          {
            text: '赞助鸣谢',
            link: '/support-us#sponsor-acknowledgement',
          },
          {
            text: '技术鸣谢',
            link: '/credits',
          },
        ],
      },
      {
        text: '法律相关',
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
        text: '其他',
        items: [
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
  },
]

export default nav
