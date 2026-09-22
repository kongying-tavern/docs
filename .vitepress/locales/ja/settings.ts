import type { CustomConfig } from '../types'

const settings: CustomConfig['settings'] = {
  title: '設定',
  description: 'このブラウザでのサイトの表示と動作を調整します。変更は自動的に保存されます。',
  back: '前のページに戻る',
  copyFailed: 'コピーに失敗しました。もう一度お試しいただくか、テキストを手動でコピーしてください',
  appearance: {
    title: '外観',
    description: 'サイトのテーマ表示を選択します。',
    theme: 'テーマモード',
    themeDescription: 'ドキュメント、フィードバック、その他のページに適用されます。',
    light: 'ライト',
    dark: 'ダーク',
    auto: 'システム設定',
  },
  notifications: {
    title: '通知',
    description: 'ページ内メッセージの表示方法を調整します。',
    position: '表示位置',
    positionDescription: '通知をページのどこに表示するか選択します。',
    duration: '表示時間',
    durationDescription: '通知が閉じる速さ、または手動で閉じるまで表示する設定を選択します。',
    fast: '速い',
    default: '標準',
    slow: '遅い',
    persistent: '常時表示',
    previewMessage: 'これはテスト通知です',
    positions: {
      topLeft: '左上',
      topCenter: '上中央',
      topRight: '右上',
      bottomLeft: '左下',
      bottomCenter: '下中央',
      bottomRight: '右下',
    },
  },
  language: {
    title: '言語と翻訳',
    description: '他の言語のコンテンツの表示方法を調整します。',
    excludedSourceLanguages: '自動翻訳しない原文言語',
    excludedSourceLanguagesDescription: 'これらの言語が検出された場合は原文を保持します。手動翻訳は引き続き利用できます。',
    searchLanguages: '言語を検索して選択…',
    chooseLanguages: '言語を選択',
    noLanguagesFound: '一致する言語がありません',
    unavailable: 'このブラウザはフィードバックのローカル翻訳に対応していません。',
  },
  privacy: {
    title: 'プライバシーと診断',
    description: 'サイトの問題調査に使用する診断情報を管理します。',
  },
}

export default settings
