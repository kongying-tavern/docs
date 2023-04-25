import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://yuanshen.site/docs/en/'
export const META_TITLE = 'Genshin Interactive Map'
export const META_DESCRIPTION =
  'A Genshin interactive map by Kongying Tavern for completionists'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  description: META_DESCRIPTION,
  themeConfig: {
    siteTitle: 'Genshin Interactive Map',
    outlineTitle: 'On This Page',
    logo: '/imgs/logo_256.png',
    lastUpdatedText: 'Last updated',
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kongying-tavern/' },
      { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
      { icon: 'twitter', link: 'https://twitter.com/KongyingTavern' },
    ],

    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },
    editLink: {
      pattern: 'https://github.com/kongying-tavern/docs/edit/src/:path',
      text: 'Suggest changes to this page',
    },

    nav: [
      {
        text: 'Support',
        items: [
          {
            text: 'Client User Manual',
            link: 'en/manual/client-user-manual',
          },
          {
            text: 'Feedback',
            link: 'https://support.qq.com/products/321980',
          },
          {
            text: 'New Features',
            link: 'https://support.qq.com/products/321980/topic-detail/2016/',
          },
        ],
      },
      {
        text: 'Community',
        link: 'en/community.md',
      },
      {
        text: 'About',
        items: [
          {
            text: 'About Us',
            items: [
              {
                text: 'Join Us',
                link: 'en/join.md',
              },
              {
                text: 'Our Team',
                link: 'en/team.md',
              },
            ],
          },
          {
            text: 'Update Log',
            items: [
              {
                text: 'Web',
                link: 'https://support.qq.com/products/321980/blog/505810',
              },
              {
                text: 'Client',
                link: 'https://discord.gg/SWz6RTWNkm',
              },
            ],
          },
          {
            text: 'Acknowledgement',
            items: [
              {
                text: 'Credits',
                link: 'en/credits.md',
              },
              {
                text: 'Contributors',
                link: 'en/contribution.md',
              },
              {
                text: 'Sponsors',
                link: 'en/support-us.md#Sponsor%20Acknowledgements',
              },
            ],
          },
          {
            text: 'Legal (Chinese)',
            items: [
              {
                text: 'Disclaimer',
                link: 'en/disclaimer.md',
              },
              {
                text: 'Privacy',
                link: 'en/privacy.md',
              },
              {
                text: 'User Agreement',
                link: 'en/agreement.md',
              },
            ],
          },
        ],
      },
      {
        text: 'Support us',
        link: 'en/support-us.md',
      },
    ],
    footer: {
      // @ts-ignore
      qrcodeTitle: 'Discord Server',
      qrcodeMessage: 'Contact us on discord',
      qrcodeLink: 'https://discord.gg/aFe57AKZUF',
      navigation: [
        {
          title: 'About',
          items: [
            {
              text: 'Join Us',
              link: 'en/join',
            },
            {
              text: 'Our team',
              link: 'en/team',
            },
            {
              text: 'Sponsors',
              link: 'en/support-us',
            },
          ],
        },
        {
          title: 'Legal (Chinese)',
          items: [
            {
              text: 'Disclaimer',
              link: 'en/disclaimer',
            },
            {
              text: 'Privacy',
              link: 'en/privacy',
            },
            {
              text: 'User Agreement',
              link: 'en/agreement',
            },
          ],
        },
        {
          title: 'Support',
          items: [
            {
              text: 'Client User Manual',
              link: 'en/manual/client-user-manual',
            },
            {
              text: 'Feedback',
              link: 'https://support.qq.com/products/321980',
            },
            {
              text: 'New Features',
              link: 'https://support.qq.com/products/321980/topic-detail/2016/',
            },
          ],
        },
      ],
    },
  },
  head: [
    ['meta', { property: 'og:url', content: META_URL }],
    ['meta', { property: 'og:description', content: META_DESCRIPTION }],
    ['meta', { property: 'twitter:url', content: META_URL }],
    ['meta', { property: 'twitter:title', content: META_TITLE }],
    ['meta', { property: 'twitter:description', content: META_DESCRIPTION }],
  ],
}
