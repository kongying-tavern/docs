import type { CustomConfig } from '../types.ts'

const ui: CustomConfig['ui'] = {
  title: {
    templateMappings: [
      {
        test: /(^|\/?)manual\/client\/?/,
        template: ':title - ユーザーマニュアル | 空蛍酒場',
      },
    ],
  },
  banner: {
    wip: 'このページの翻訳は準備中です。',
  },
  chunkLoadRecovery: {
    description: '一部の内容を読み込めませんでした。接続の問題、またはページの更新が原因の可能性があります。未送信の内容を保存し、接続を確認してから再読み込みしてください。',
    reload: '再読み込み',
    later: '後で',
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
