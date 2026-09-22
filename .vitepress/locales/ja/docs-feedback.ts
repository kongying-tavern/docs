import type { CustomConfig } from '../types'

const docReaction: CustomConfig['docReaction'] = {
  feedbackMsg: 'このドキュメントは役立ちましたか？',
  good: '役立つ',
  bad: '役に立たない',
  feedbackFailMsg:
    'フィードバックの送信に失敗しました。再試行するか、管理者に連絡してください（QQ：1961266616）。',
  feedbackSuccessMsg:
    'フィードバックが正常に送信されました。ありがとうございます！',
  badFeedbackSuccessMsg: '以下の問題を具体的にお知らせください〜',
  loadingMsg: '読み込み中…',
  errorMessage: 'エラー情報：',
  viewFeedback: 'フィードバックを表示 #{id}',
  form: {
    chooseIssues: '次のような問題は発生しましたか？',
    feedbackDetail: '詳細/提案',
    feedbackTip: '発生した問題や改善案を具体的にご記入ください',
    issueOptions: [
      { label: 'ページ表示エラー', value: 'CATA-DISPLAY' },
      { label: '誤字、句読点のエラー', value: 'CATA-TYPOS' },
      { label: 'コンテンツ、画像、リンクのエラー', value: 'CATA-DOCS' },
      { label: 'その他の問題', value: 'CATA-OTHER' },
    ],
  },
}

export default docReaction
