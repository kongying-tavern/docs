import type { CustomConfig } from '../types'

const footer: CustomConfig['footer'] = {
  qrcodeTitle: 'Serveur Discord',
  qrcodeMessage: 'Contactez-nous sur Discord',
  qrcodeLink: 'https://discord.gg/aFe57AKZUF',
  navigation: [
    {
      title: 'À propos',
      items: [
        {
          text: 'Rejoignez-nous',
          link: '/join',
        },
        {
          text: 'Notre équipe',
          link: '/team',
        },
        {
          text: 'Sponsors',
          link: '/support-us',
        },
      ],
    },
    {
      title: 'Mentions légales (chinois)',
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
      title: 'Support',
      items: [
        {
          text: "Manuel d'utilisation du client",
          link: '/manual/client-user-manual',
        },
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
  ],
}

export default footer
