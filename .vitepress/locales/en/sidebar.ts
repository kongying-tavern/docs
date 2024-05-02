import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarItem[] = {
  // @ts-ignore
  '/manual': [
    {
      text: 'Table of Contents',
      link: '/manual/client',
    },
    {
      text: 'Guides',
      collapsed: false,
      items: [
        {
          text: 'Automatic Tracking',
          items: [
            {
              text: 'Introduction',
              link: '/manual/client/position-tracking',
            },
            {
              text: 'Troubleshooting',
              link: '/manual/client/position-tracking',
            },
          ],
        },
        {
          text: 'Framerate/Tracking Control',
          link: '/manual/client/framerate',
        },
        {
          text: 'Multi Mark',
          link: '/manual/client/batch-selection',
        },
        {
          text: 'Canvas Guide',
          link: '/manual/client/canvas',
        },
        {
          text: 'Easter Egg',
          link: '/manual/client/easter-egg',
        },
        {
          text: 'Hide/Show Found',
          link: '/manual/client/hide-show-done',
        },
        {
          text: 'Overlay Mode',
          items: [
            {
              text: 'Instructions',
              link: '/manual/client/overlay-mode',
            },
            {
              text: 'Windowed Fullscreen',
              link: '/manual/client/fullscreen-windowed',
            },
          ],
        },
        {
          text: 'Restore/Recover Progress',
          link: '/manual/client/save-restore',
        },
      ],
    },
    {
      text: 'FAQ',
      collapsed: false,
      items: [
        {
          text: 'Account safety',
          link: '/manual/faq/accountsafety/acntban',
        },
        {
          text: 'Auto Update',
          link: '/manual/faq/autoupdate/updater',
        },
        {
          text: 'Installation Error',
          items: [
            {
              text: 'Code 2503',
              link: '/manual/faq/instlerror/code2503',
            },
            {
              text: 'Missing .dll file',
              link: '/manual/faq/instlerror/missingdll',
            },
          ],
        },
        {
          text: 'Launch Error',
          items: [
            {
              text: 'Stuck/No Progress',
              link: '/manual/faq/launcherror/emptydialog',
            },
            {
              text: 'Version Check Failed',
              link: '/manual/faq/launcherror/versioncheck',
            },
          ],
        },
        {
          text: 'About Login',
          items: [
            {
              text: 'Login Problems',
              link: '/manual/faq/login/accountlogin',
            },
            {
              text: 'Repeated Login Requests',
              link: '/manual/faq/login/clientrepeatedly',
            },
          ],
        },
      ],
    },
  ],
}

export default sidebar
