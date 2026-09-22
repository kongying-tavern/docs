import type { CustomConfig } from '../types'

const ui: CustomConfig['ui'] = {
  title: {
    templateMappings: [
      {
        test: /(^|\/?)manual\/client\/?/,
        template: ':title - アプリガイダンス | 空蛍酒場',
      },
    ],
  },
  banner: {
    wip: 'このページの翻訳は準備中です。',
  },
  button: {
    submit: '送信',
    cancel: 'キャンセル',
    loading: '読み込み中',
    search: '検索',
    close: '閉じる',
    all: 'すべて',
    emoji: '絵文字',
  },
  sitemap: {
    blog: 'ブログ記事',
    manual: 'ユーザーマニュアル',
    general: '一般ページ',
    api: 'API ドキュメント',
    guide: 'ガイド',
    community: 'コミュニティ',
    about: '私たちについて',
  },
}

export default ui
