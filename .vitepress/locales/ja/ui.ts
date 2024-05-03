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
  },
}

export default ui
