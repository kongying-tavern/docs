import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarMulti = {
  '/manual': [
    {
      text: '目录',
      link: '/manual/client/',
    },
    {
      text: '使用手册',
      collapsed: false,
      items: [
        {
          text: '批量选择',
          link: '/manual/client/batch-selection',
        },
        {
          text: '隐藏/显示标记',
          link: '/manual/client/hide-show-done',
        },
        {
          text: '覆盖模式',
          link: '/manual/client/overlay-mode',
        },
        {
          text: '位置追踪',
          link: '/manual/client/position-tracking',
        },
        {
          text: '画板/路线功能',
          link: '/manual/client/canvas',
        },
        {
          text: '窗口全屏/无边框窗口模式',
          link: '/manual/client/fullscreen-windowed',
        },
        {
          text: '帧率设置',
          link: '/manual/client/framerate',
        },
        {
          text: '存档恢复',
          link: '/manual/client/save-restore',
        },
        {
          text: '彩蛋',
          link: '/manual/client/easter-egg',
        },
      ],
    },
    {
      text: '常见问题',
      collapsed: false,
      items: [
        {
          text: '使用地图客户端会被封号吗？',
          link: '/manual/faq/accountsafety/acntban',
        },
        {
          text: '【自动更新】没有反应',
          link: '/manual/faq/autoupdate/updater',
        },
        {
          text: '安装错误',
          items: [
            {
              text: '错误码 2503',
              link: '/manual/faq/instlerror/code2503',
            },
            {
              text: '【无法安装】提示缺乏 dll 文件',
              link: '/manual/faq/instlerror/missingdll',
            },
          ],
        },
        {
          text: '【无法打开】',
          items: [
            {
              text: '空窗提示或卡进度条',
              link: '/manual/faq/launcherror/emptydialog',
            },
            {
              text: '“数据查询失败”、“版本查询失败”',
              link: '/manual/faq/launcherror/versioncheck',
            },
          ],
        },
        {
          text: '登录',
          items: [
            {
              text: '【不能登录】如何登录',
              link: '/manual/faq/login/accountlogin',
            },
            {
              text: '【每次打开都需重新登陆】',
              link: '/manual/faq/login/clientrepeatedly',
            },
          ],
        },
      ],
    },
  ],
}

export default sidebar
