import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarMulti = {
  '/manual': [
    {
      text: 'Table of Contents',
      link: '/manual/client/',
    },
    {
      text: 'Handbook',
      collapsed: false,
      items: [
        {
          text: 'Marking Multiple Pins',
          link: '/manual/client/batch-selection',
        },
        {
          text: 'Change Pin Visibility',
          link: '/manual/client/hide-show-done',
        },
        {
          text: 'Overlay Mode',
          link: '/manual/client/overlay-mode',
        },
        {
          text: 'Position Tracker',
          link: '/manual/client/position-tracking',
        },
        {
          text: 'Custom Path Planner (Canvas)',
          link: '/manual/client/canvas',
        },
        {
          text: 'Launching The Game in Windowed Fullscreen',
          link: '/manual/client/fullscreen-windowed',
        },
        {
          text: 'Framerate/Tracking Control',
          link: '/manual/client/framerate',
        },
        {
          text: 'Progress Recovery',
          link: '/manual/client/save-restore',
        },
        {
          text: 'Easter Eggs',
          link: '/manual/client/easter-egg',
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
