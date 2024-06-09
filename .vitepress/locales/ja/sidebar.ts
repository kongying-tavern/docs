import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarMulti = {
  '/manual': [
    {
      text: '目次',
      link: '/manual/client/',
    },
    {
      text: 'ガイダンス',
      collapsed: false,
      items: [
        {
          text: '一括選択',
          link: '/manual/client/batch-selection',
        },
        {
          text: 'マーカー表示/非表示',
          link: '/manual/client/hide-show-done',
        },
        {
          text: 'オーバーレイモード',
          link: '/manual/client/overlay-mode',
        },
        {
          text: 'オートトラ',
          link: '/manual/client/position-tracking',
        },
        {
          text: 'キャンバス-ルート計画',
          link: '/manual/client/canvas',
        },
        {
          text: 'ウィンドウ全画面/ボーダレスウィンドウモード',
          link: '/manual/client/fullscreen-windowed',
        },
        {
          text: 'フレームレート',
          link: '/manual/client/framerate',
        },
        {
          text: 'データ復元',
          link: '/manual/client/save-restore',
        },
        {
          text: 'イースターエッグ',
          link: '/manual/client/easter-egg',
        },
      ],
    },
    {
      text: 'よくある質問',
      items: [
        {
          text: 'ゲームアカウントが凍結される可能性は？',
          link: '/manual/faq/accountsafety/acntban',
        },
        {
          text: '【自動更新】自動更新されない',
          link: '/manual/faq/autoupdate/updater',
        },
        {
          text: '【インストールできない】',
          items: [
            {
              text: 'エラーコード 2503',
              link: '/manual/faq/instlerror/code2503',
            },
            {
              text: '【インストールできない】.dll がないため',
              link: '/manual/faq/instlerror/missingdll',
            },
          ],
        },
        {
          text: '【アプリ開かない】',
          items: [
            {
              text: '画面真っ白またはプログレスバーが止まる',
              link: '/manual/faq/launcherror/emptydialog',
            },
            {
              text: '「データクエリ失敗」「バージョンチェック失敗」',
              link: '/manual/faq/launcherror/versioncheck',
            },
          ],
        },
        {
          text: 'ログイン',
          items: [
            {
              text: '【ログインできない】ログイン方法',
              link: '/manual/faq/login/accountlogin',
            },
            {
              text: '【毎回ログインを求められる】',
              link: '/manual/faq/login/clientrepeatedly',
            },
          ],
        },
      ],
    },
  ],
}

export default sidebar
