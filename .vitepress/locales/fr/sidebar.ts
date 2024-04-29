import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarItem[] = {
  // @ts-ignore
  '/manual': [
    {
      text: 'Table des matières',
      link: '/manual/client-user-manual',
    },
    {
      text: 'Guides',
      items: [
        {
          text: 'Suivi automatique',
          items: [
            {
              text: 'Introduction',
              link: '/manual/guide/auto-tracking/importantnotes',
            },
            {
              text: 'Résolution des problèmes',
              link: '/manual/guide/auto-tracking/troubleshoot',
            },
          ],
        },
        {
          text: "Contrôle de la fréquence d'images/du suivi",
          link: '/manual/guide/bg/bgfrate',
        },
        {
          text: 'Marquage multiple',
          link: '/manual/guide/batch-selection/instructions',
        },
        {
          text: 'Guide du canvas',
          link: '/manual/guide/canvas/guide',
        },
        {
          text: 'Easter Egg',
          link: '/manual/guide/easter-egg/view',
        },
        {
          text: 'Cacher/Afficher les éléments trouvés',
          link: '/manual/guide/hide-show-done/hidedoneshowdone',
        },
        {
          text: 'Mode superposition',
          items: [
            {
              text: 'Instructions',
              link: '/manual/guide/overlay-mode/instructions',
            },
            {
              text: 'Fenêtré plein écran',
              link: '/manual/guide/overlay-mode/fullscreen-windowed/launching',
            },
          ],
        },
        {
          text: 'Restauration/récupération de la progression',
          link: '/manual/guide/restore-recover/progress',
        },
      ],
    },
    {
      text: 'FAQ',
      items: [
        {
          text: 'Sécurité du compte',
          link: '/manual/faq/accountsafety/acntban',
        },
        {
          text: 'Mise à jour automatique',
          link: '/manual/faq/autoupdate/updater',
        },
        {
          text: "Erreur d'installation",
          items: [
            {
              text: 'Code 2503',
              link: '/manual/faq/instlerror/code2503',
            },
            {
              text: 'Fichier .dll manquant',
              link: '/manual/faq/instlerror/missingdll',
            },
          ],
        },
        {
          text: 'Erreur de lancement',
          items: [
            {
              text: 'Blocage/pas de progression',
              link: '/manual/faq/launcherror/emptydialog',
            },
            {
              text: 'Échec de la vérification de la version',
              link: '/manual/faq/launcherror/versioncheck',
            },
          ],
        },
        {
          text: 'À propos de la connexion',
          items: [
            {
              text: 'Problèmes de connexion',
              link: '/manual/faq/login/accountlogin',
            },
            {
              text: 'Demandes de connexion répétées',
              link: '/manual/faq/login/clientrepeatedly',
            },
          ],
        },
      ],
    },
  ],
}

export default sidebar
