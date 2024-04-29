import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarItem[] = {
  // @ts-ignore
  '/manual': [
    {
      text: 'Table of Contents',
      link: '/manual/client-user-manual',
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
              link: '/manual/guide/auto-tracking/importantnotes',
            },
            {
              text: 'Troubleshooting',
              link: '/manual/guide/auto-tracking/troubleshoot',
            },
          ],
        },
        {
          text: 'Framerate/Tracking Control',
          link: '/manual/guide/bg/bgfrate',
        },
        {
          text: 'Multi Mark',
          link: '/manual/guide/batch-selection/instructions',
        },
        {
          text: 'Canvas Guide',
          link: '/manual/guide/canvas/guide',
        },
        {
          text: 'Easter Egg',
          link: '/manual/guide/easter-egg/view',
        },
        {
          text: 'Hide/Show Found',
          link: '/manual/guide/hide-show-done/hidedoneshowdone',
        },
        {
          text: 'Overlay Mode',
          items: [
            {
              text: 'Instructions',
              link: '/manual/guide/overlay-mode/instructions',
            },
            {
              text: 'Windowed Fullscreen',
              link: '/manual/guide/overlay-mode/fullscreen-windowed/launching',
            },
          ],
        },
        {
          text: 'Restore/Recover Progress',
          link: '/manual/guide/restore-recover/progress',
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
