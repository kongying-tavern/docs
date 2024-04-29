import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarItem[] = {
  // @ts-ignore
  '/manual': [
    {
      text: '目录',
      link: '/manual/client-user-manual',
    },
    {
      text: '使用帮助',
      collapsed: false,
      items: [
        {
          text: '【自动追踪】',
          items: [
            {
              text: '功能介绍',
              link: '/manual/guide/auto-tracking/importantnotes',
            },
            {
              text: '疑难解答',
              link: '/manual/guide/auto-tracking/troubleshoot',
            },
          ],
        },
        {
          text: '【地图性能占用高】前后台帧率设置',
          link: '/manual/guide/bg/bgfrate',
        },
        {
          text: '【批量选择】使用说明',
          link: '/manual/guide/batch-selection/instructions',
        },
        {
          text: '【画板】路线功能 教程',
          link: '/manual/guide/canvas/guide',
        },
        {
          text: '【彩蛋】查看历史版本内容',
          link: '/manual/guide/easter-egg/view',
        },
        {
          text: '【隐藏】标记/【显示】标记',
          link: '/manual/guide/hide-show-done/hidedoneshowdone',
        },
        {
          text: '【覆盖模式】',
          items: [
            {
              text: '使用说明',
              link: '/manual/guide/overlay-mode/instructions',
            },
            {
              text: '【窗口全屏】启动游戏',
              link: '/manual/guide/overlay-mode/fullscreen-windowed/launching',
            },
          ],
        },
        {
          text: '【存档丢失】存档还原/误删恢复',
          link: '/manual/guide/restore-recover/progress',
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
