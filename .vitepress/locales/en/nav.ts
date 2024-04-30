import type { DefaultTheme } from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'Community',
    link: '/community',
    activeMatch: '^/en/community',
  },
  {
    text: 'Support us',
    link: '/support-us',
    activeMatch: '^/en/support-us',
  },
  {
    text: 'Map Utilities',
    activeMatch: '^/en/(download-client|manual/)',
    items: [
      {
        text: 'Download',
        link: '/download-client',
        activeMatch: '^/en/download-client',
      },
      {
        text: 'Windows Client',
        items: [
          {
            text: 'Manual',
            link: '/manual/client-user-manual',
            activeMatch: '^/en/manual/',
          },
          {
            text: 'Release Notes',
            link: 'https://support.qq.com/products/321980/blog/505884',
          },
        ],
      },
      {
        text: 'Web Version',
        items: [
          {
            text: 'Try Now',
            link: 'https://v3.yuanshen.site',
          },
          {
            text: 'Release Notes',
            link: 'https://support.qq.com/products/321980/blog/505810',
          },
        ],
      },
    ],
  },
  {
    text: 'Support',
    items: [
      {
        text: 'Feedback',
        link: 'https://support.qq.com/products/321980',
      },
      {
        text: 'Feature Requests',
        link: 'https://support.qq.com/products/321980/topic-detail/2016/',
      },
    ],
  },
  {
    text: 'About',
    activeMatch:
      '^/en/(join|team|staff|support-us|credits|disclaimer|privacy|agreement|translations|friends-links)',
    items: [
      {
        text: 'About Us',
        items: [
          {
            text: 'Join Us',
            link: '/join',
            activeMatch: '^/en/join',
          },
          {
            text: 'Our Team',
            link: '/team',
            activeMatch: '^/en/team',
          },
        ],
      },
      {
        text: 'Acknowledgements',
        items: [
          {
            text: 'Contributors',
            link: '/staff',
            activeMatch: '^/en/staff',
          },
          {
            text: 'Sponsors',
            link: '/support-us#sponsor-acknowledgement',
            activeMatch: '^/en/support-us',
          },
          {
            text: 'Credits',
            link: '/credits',
            activeMatch: '^/en/credits',
          },
        ],
      },
      {
        text: 'Legal (Chinese)',
        items: [
          {
            text: 'Disclaimer',
            link: '/disclaimer',
            activeMatch: '^/en/disclaimer',
          },
          {
            text: 'Privacy',
            link: '/privacy',
            activeMatch: '^/en/privacy',
          },
          {
            text: 'Agreement',
            link: '/agreement',
            activeMatch: '^/en/agreement',
          },
        ],
      },
      {
        text: 'Other',
        items: [
          {
            text: 'Translate for Us',
            link: '/translations',
            activeMatch: '^/en/translations',
          },
          {
            text: 'Friend-links',
            link: '/friends-links',
            activeMatch: '^/en/friends-links',
          },
        ],
      },
    ],
  },
]

export default nav
