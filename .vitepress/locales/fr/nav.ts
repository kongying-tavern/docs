import type { DefaultTheme } from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'Communauté',
    link: '/community',
    activeMatch: '^/fr/community',
  },
  {
    text: 'Soutenez-nous',
    link: '/support-us',
    activeMatch: '^/fr/support-us',
  },
  {
    text: 'APP',
    activeMatch: '^/fr/(download-client|manual/)',
    items: [
      {
        text: 'Télécharger le client',
        link: '/download-client',
        activeMatch: '^/fr/download-client',
      },
      {
        text: 'Client pour Windows',
        items: [
          {
            text: `Guides d'utilisations`,
            link: '/manual/client',
            activeMatch: '^/fr/manual/',
          },
          {
            text: 'Note des mises à jour',
            link: 'https://support.qq.com/products/321980/blog/505884',
          },
        ],
      },
      {
        text: 'Carte en ligne',
        items: [
          {
            text: 'Éssayer maintenant',
            link: 'https://v3.yuanshen.site',
          },
          {
            text: 'Note des mises à jour',
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
        text: "Retour d'expérience",
        link: 'https://support.qq.com/products/321980',
      },
      {
        text: 'Nouvelles fonctionnalités',
        link: 'https://support.qq.com/products/321980/topic-detail/2016/',
      },
    ],
  },
  {
    text: 'À propos',
    activeMatch:
      '^/fr/(join|team|staff|support-us|credits|disclaimer|privacy|agreement|translations|friends-links)',
    items: [
      {
        text: 'À propos de nous',
        items: [
          {
            text: 'Rejoignez-nous',
            link: '/join',
            activeMatch: '^/fr/join',
          },
          {
            text: 'Notre équipe',
            link: '/team',
            activeMatch: '^/fr/team',
          },
        ],
      },
      {
        text: 'Remerciements',
        items: [
          {
            text: 'Contributeurs',
            link: '/staff',
            activeMatch: '^/fr/staff',
          },
          {
            text: 'Sponsors',
            link: '/support-us#sponsor-acknowledgement',
            activeMatch: '^/fr/support-us',
          },
          {
            text: 'Crédits',
            link: '/credits',
            activeMatch: '^/fr/credits',
          },
        ],
      },
      {
        text: 'Mentions légales (chinois)',
        items: [
          {
            text: 'Clause de non-responsabilité',
            link: '/disclaimer',
            activeMatch: '^/fr/disclaimer',
          },
          {
            text: 'Confidentialité',
            link: '/privacy',
            activeMatch: '^/fr/privacy',
          },
          {
            text: 'Accord',
            link: '/agreement',
            activeMatch: '^/fr/agreement',
          },
        ],
      },
      {
        text: 'À propos',
        items: [
          {
            text: 'Participer aux translations',
            link: '/translations',
            activeMatch: '^/fr/translations',
          },
          {
            text: 'Échange de liens',
            link: '/friends-links',
            activeMatch: '^/fr/friends-links',
          },
        ],
      },
    ],
  },
]

export default nav
