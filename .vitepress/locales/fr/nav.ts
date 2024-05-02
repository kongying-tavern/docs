import type { DefaultTheme } from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'Communauté',
    link: '/community',
  },
  {
    text: 'Soutenez-nous',
    link: '/support-us',
  },
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
            link: '/manual/client',
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
            text: 'Contributeurs',
            link: '/staff',
          },
          {
            text: 'Sponsors',
            link: '/support-us#sponsor-acknowledgement',
          },
          {
            text: 'Crédits',
            link: '/credits',
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
      {
        text: 'À propos',
        items: [
          {
            text: 'Participer aux translations',
            link: '/translations',
          },
          {
            text: 'Échange de liens',
            link: '/friends-links',
          },
        ],
      },
    ],
  },
]

export default nav
