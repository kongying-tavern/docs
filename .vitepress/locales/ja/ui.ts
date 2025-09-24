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
    wip: '申し訳ありませんが、このページの翻訳はまだ進行中です。',
  },
  button: {
    submit: '提出する',
    cancel: 'キャンセル',
    loading: 'Loading',
    search: '検索',
    close: '閉鎖',
    all: '全て',
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
