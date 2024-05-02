import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarItem[] = {
  // @ts-ignore
  '/manual': [
    {
      text: '目次',
      link: '/manual/client',
    },
    {
      text: '使い方ガイド',
      items: [
        {
          text: '【オートトラッキング】',
          items: [
            {
              text: '機能紹介',
              link: '/manual/client/position-tracking',
            },
            {
              text: 'トラブルシューティング',
              link: '/manual/client/position-tracking',
            },
          ],
        },
        {
          text: '【バックグラウンドユーセージ】フレームレート設定',
          link: '/manual/client/framerate',
        },
        {
          text: '【一括選択】利用ガイド',
          link: '/manual/client/batch-selection',
        },
        {
          text: '【キャンバス】ルート計画機能紹介',
          link: '/manual/client/canvas',
        },
        {
          text: '【おまけ】金リンゴ群島を見る',
          link: '/manual/client/easter-egg',
        },
        {
          text: '【表示】/【非表示】マーカー',
          link: '/manual/client/hide-show-done',
        },
        {
          text: '【オーバーレイモード】',
          items: [
            {
              text: '利用ガイド',
              link: '/manual/client/overlay-mode',
            },
            {
              text: '【ウィンドウ全画面】ゲーム起動',
              link: '/manual/client/fullscreen-windowed',
            },
          ],
        },
        {
          text: '【セーブデータ】データ復元',
          link: '/manual/client/save-restore',
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
