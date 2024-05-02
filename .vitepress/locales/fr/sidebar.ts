import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarMulti = {
  '/manual': [
    {
      text: 'Table des matières',
      link: '/manual/client',
    },
    {
      text: 'Guides',
      items: [
        {
          text: 'Suivi automatique',
          items: [
            {
              text: 'Introduction',
              link: '/manual/client/position-tracking',
            },
            {
              text: 'Résolution des problèmes',
              link: '/manual/client/position-tracking',
            },
          ],
        },
        {
          text: "Contrôle de la fréquence d'images/du suivi",
          link: '/manual/client/framerate',
        },
        {
          text: 'Marquage multiple',
          link: '/manual/client/batch-selection',
        },
        {
          text: 'Guide du canvas',
          link: '/manual/client/canvas',
        },
        {
          text: 'Easter Egg',
          link: '/manual/client/easter-egg',
        },
        {
          text: 'Cacher/Afficher les éléments trouvés',
          link: '/manual/client/hide-show-done',
        },
        {
          text: 'Mode superposition',
          items: [
            {
              text: 'Instructions',
              link: '/manual/client/overlay-mode',
            },
            {
              text: 'Fenêtré plein écran',
              link: '/manual/client/fullscreen-windowed',
            },
          ],
        },
        {
          text: 'Restauration/récupération de la progression',
          link: '/manual/client/save-restore',
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
