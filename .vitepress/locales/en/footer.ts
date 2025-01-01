import type { CustomConfig } from '../types'

const footer: CustomConfig['footer'] = {
  qrcodeTitle: 'Discord Server',
  qrcodeMessage: 'Contact us on discord',
  qrcodeLink: 'https://discord.gg/aFe57AKZUF',
  navigation: [
    {
      title: 'About',
      items: [
        {
          text: 'Join Us',
          link: '/join',
        },
        {
          text: 'Our team',
          link: '/team',
        },
        {
          text: 'Sponsors',
          link: '/support-us',
        },
      ],
    },
    {
      title: 'Legal (Chinese)',
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
      title: 'Support',
      items: [
        {
          text: 'Client User Manual',
          link: '/manual/client/',
        },
        {
          text: 'Feedback',
          link: '/feedback/',
        },
        // {
        //   text: 'New Features',
        //   link: 'https://support.qq.com/products/321980/topic-detail/2016/',
        // },
      ],
    },
  ],
}

export default footer
