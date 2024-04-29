import type { DefaultTheme } from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'APP',
    items: [
      {
        text: 'Télécharger le client',
        link: '/download-client',
      },
      {
        text: 'Client pour Windows',
        items: [
          {
            text: `Guides d'utilisations`,
            link: '/manual/client-user-manual',
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
    text: 'Soutenez-nous',
    link: '/support-us',
  },
  {
    text: 'Communauté',
    link: '/community',
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
    items: [
      {
        text: 'À propos de nous',
        items: [
          {
            text: 'Rejoignez-nous',
            link: '/join',
          },
          {
            text: 'Notre équipe',
            link: '/team',
          },
        ],
      },
      {
        text: 'Remerciements',
        items: [
          {
            text: 'Crédits',
            link: '/credits',
          },
          {
            text: 'Contributeurs',
            link: '/contribution',
          },
          {
            text: 'Sponsors',
            link: '/support-us#sponsor-acknowledgement',
          },
        ],
      },
      {
        text: 'Mentions légales (chinois)',
        items: [
          {
            text: 'Clause de non-responsabilité',
            link: '/disclaimer',
          },
          {
            text: 'Confidentialité',
            link: '/privacy',
          },
          {
            text: 'Accord',
            link: '/agreement',
          },
        ],
      },
    ],
  },
]

export default nav
