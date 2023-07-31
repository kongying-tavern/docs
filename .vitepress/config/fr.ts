import fs from 'fs'
import path from 'path'

import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from './types'

export const META_URL = 'https://yuanshen.site/docs/fr'
export const META_TITLE = 'Genshin Interactive Map'
export const META_KEYWORDS =
  'Genshin Interactive Map, Genshin Map, Kongying Tavern, yuanshenmap, Genshin Impact Map, Kongying Map'
export const META_DESCRIPTION =
  'A Genshin interactive map by Kongying Tavern for completionists'

export const frConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  description: META_DESCRIPTION,
  titleTemplate: 'Kongying Tavern',
  themeConfig: {
    siteTitle: 'Carte interactive de Genshin',
    outlineTitle: 'Sur cette page',
    logo: '/imgs/logo_256.png',
    lastUpdatedText: 'Dernière mise à jour ',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kongying-tavern' },
      {
        icon: {
          svg: fs.readFileSync(
            path.resolve(__dirname, '../../src/public/svg/reddit.svg'),
            'utf8'
          ),
        },
        link: 'https://www.reddit.com/user/Kongying_Tavern',
      },
      { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
      { icon: 'twitter', link: 'https://twitter.com/KongyingTavern' },
    ],

    docFooter: {
      prev: 'Page précédente',
      next: 'Page suivante',
    },
    editLink: {
      pattern: 'https://github.com/kongying-tavern/docs/edit/next/src/:path',
      text: 'Suggérer des modifications à cette page',
    },
    payment: {
      wechatpay: {
        name: 'WeChat Pay',
        address: 'wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp',
      },
      alipay: {
        name: 'Alipay',
        address: 'https://qr.alipay.com/tsx11609thmpw9odmvdlxd6',
      },
      qqpay: {
        name: 'QQ Pay',
        address:
          'https://i.qianbao.qq.com/wallet/sqrcode.htm?m=tenpay&a=1&u=790489566&ac=CAEQ3tP3-AIY0v2k_AU%3D_xxx_sign&n=AAAAAAAA&f=wallet',
      },
      paypal: {
        name: 'Paypal',
        address: 'https://www.paypal.com/paypalme/yuanshenditu',
      },
      bilibili: {
        name: 'bilibili',
        address: 'https://space.bilibili.com/518076785',
      },
    },
    nav: [
      {
        text: 'Télécharger',
        link: 'fr/download-client.md',
      },
      {
        text: 'Soutenez-nous',
        link: 'fr/support-us.md',
      },
      {
        text: 'Communauté',
        link: 'fr/community.md',
      },
      {
        text: 'Support',
        items: [
          {
            text: "Manuel d'utilisation du client",
            link: 'fr/manual/client-user-manual.md',
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
      {
        text: 'À propos',
        items: [
          {
            text: 'À propos de nous',
            items: [
              {
                text: 'Rejoignez-nous',
                link: 'fr/join.md',
              },
              {
                text: 'Notre équipe',
                link: 'fr/team.md',
              },
            ],
          },
          {
            text: 'Journal des mises à jour',
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
            text: 'Remerciements',
            items: [
              {
                text: 'Crédits',
                link: 'fr/credits.md',
              },
              {
                text: 'Contributeurs',
                link: 'fr/contribution.md',
              },
              {
                text: 'Sponsors',
                link: 'fr/support-us.md#Sponsor%20Acknowledgements',
              },
            ],
          },
          {
            text: 'Mentions légales (chinois)',
            items: [
              {
                text: 'Clause de non-responsabilité',
                link: 'fr/disclaimer.md',
              },
              {
                text: 'Confidentialité',
                link: 'fr/privacy.md',
              },
              {
                text: 'Accord',
                link: 'fr/agreement.md',
              },
            ],
          },
        ],
      },
    ],
    sidebar: {
      'fr/manual': [
        {
          text: 'Table des matières',
          link: 'fr/manual/client-user-manual',
        },
        {
          text: 'Guides',
          items: [
            {
              text: 'Suivi automatique',
              items: [
                {
                  text: 'Introduction',
                  link: 'fr/manual/guide/auto-tracking/importantnotes',
                },
                {
                  text: 'Résolution des problèmes',
                  link: 'fr/manual/guide/auto-tracking/troubleshoot',
                },
              ],
            },
            {
              text: "Contrôle de la fréquence d'images/du suivi",
              link: 'fr/manual/guide/bg/bgfrate',
            },
            {
              text: 'Marquage multiple',
              link: 'fr/manual/guide/batch-selection/instructions',
            },
            {
              text: 'Guide du canvas',
              link: 'fr/manual/guide/canvas/guide',
            },
            {
              text: 'Easter Egg',
              link: 'fr/manual/guide/easter-egg/view',
            },
            {
              text: 'Cacher/Afficher les éléments trouvés',
              link: 'fr/manual/guide/hide-show-done/hidedoneshowdone',
            },
            {
              text: 'Mode superposition',
              items: [
                {
                  text: 'Instructions',
                  link: 'fr/manual/guide/overlay-mode/instructions',
                },
                {
                  text: 'Fenêtré plein écran',
                  link: 'fr/manual/guide/overlay-mode/fullscreen-windowed/launching',
                },
              ],
            },
            {
              text: 'Restauration/récupération de la progression',
              link: 'fr/manual/guide/restore-recover/progress',
            },
          ],
        },
        {
          text: 'FAQ',
          items: [
            {
              text: 'Sécurité du compte',
              link: 'fr/manual/faq/accountsafety/acntban.md',
            },
            {
              text: 'Mise à jour automatique',
              link: 'fr/manual/faq/autoupdate/updater.md',
            },
            {
              text: "Erreur d'installation",
              items: [
                {
                  text: 'Code 2503',
                  link: 'fr/manual/faq/instlerror/code2503.md',
                },
                {
                  text: 'Fichier .dll manquant',
                  link: 'fr/manual/faq/instlerror/missingdll.md',
                },
              ],
            },
            {
              text: 'Erreur de lancement',
              items: [
                {
                  text: 'Blocage/pas de progression',
                  link: 'fr/manual/faq/launcherror/emptydialog.md',
                },
                {
                  text: 'Échec de la vérification de la version',
                  link: 'fr/manual/faq/launcherror/versioncheck.md',
                },
              ],
            },
            {
              text: 'À propos de la connexion',
              items: [
                {
                  text: 'Problèmes de connexion',
                  link: 'fr/manual/faq/login/accountlogin.md',
                },
                {
                  text: 'Demandes de connexion répétées',
                  link: 'fr/manual/faq/login/clientrepeatedly.md',
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      qrcodeTitle: 'Serveur Discord',
      qrcodeMessage: 'Contactez-nous sur Discord',
      qrcodeLink: 'https://discord.gg/aFe57AKZUF',
      navigation: [
        {
          title: 'À propos',
          items: [
            {
              text: 'Rejoignez-nous',
              link: 'fr/join',
            },
            {
              text: 'Notre équipe',
              link: 'fr/team',
            },
            {
              text: 'Sponsors',
              link: 'fr/support-us',
            },
          ],
        },
        {
          title: 'Mentions légales (chinois)',
          items: [
            {
              text: 'Clause de non-responsabilité',
              link: 'fr/disclaimer',
            },
            {
              text: 'Confidentialité',
              link: 'fr/privacy',
            },
            {
              text: 'Accord',
              link: 'fr/agreement',
            },
          ],
        },
        {
          title: 'Support',
          items: [
            {
              text: "Manuel d'utilisation du client",
              link: 'fr/manual/client-user-manual',
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
    },
  },
  head: [
    ['meta', { name: 'keywords', content: META_KEYWORDS }],
    ['meta', { property: 'og:url', content: META_URL }],
    ['meta', { property: 'og:description', content: META_DESCRIPTION }],
    ['meta', { property: 'twitter:url', content: META_URL }],
    ['meta', { property: 'twitter:title', content: META_TITLE }],
    ['meta', { property: 'twitter:description', content: META_DESCRIPTION }],
    ['meta', { property: 'og:site_name', content: META_TITLE }],
    ['meta', { property: 'og:locale', content: 'en-US' }],
    ['meta', { property: 'og:image', content: `${META_URL}imgs/cover.jpg` }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: `${META_URL}imgs/cover.jpg`,
      },
    ],
  ],
}
