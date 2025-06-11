import type { DefaultTheme } from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'Community',
    link: '/community',
  },
  {
    text: 'Support us',
    link: '/support-us',
  },
  {
    text: 'Map Utilities',
    items: [
      {
        text: 'Download',
        link: '/download-client',
      },
      {
        text: 'Windows Client',
        items: [
          {
            text: 'Manual',
            link: '/manual/client/',
          },
          {
            text: 'Release Notes',
            link: '/blog/hotupdatelog-client',
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
            link: '/blog/changelog-web',
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
        link: '/feedback/',
      },
      {
        text: 'Feature Requests',
        link: '/feedback/feat',
      },
    ],
  },
  {
    text: 'About',
    items: [
      {
        text: 'About Us',
        items: [
          {
            text: 'Join Us',
            link: '/join',
          },
          {
            text: 'Our Team',
            link: '/team',
          },
          {
            text: 'Team Blog',
            link: '/blog',
          },
        ],
      },
      {
        text: 'Acknowledgements',
        items: [
          {
            text: 'Contributors',
            link: '/staff',
          },
          {
            text: 'Sponsors',
            link: '/support-us#sponsor-acknowledgement',
          },
          {
            text: 'Credits',
            link: '/credits',
          },
        ],
      },
      {
        text: 'Legal (Chinese)',
        items: [
          {
            text: 'Disclaimer',
            link: '/disclaimer',
          },
          {
            text: 'Privacy',
            link: '/privacy',
          },
          {
            text: 'Agreement',
            link: '/agreement',
          },
        ],
      },
      {
        text: 'Other',
        items: [
          {
            text: 'Translate for Us',
            link: '/translations',
          },
          {
            text: 'Friend-links',
            link: '/friends-links',
          },
        ],
      },
    ],
  },
]

export default nav
