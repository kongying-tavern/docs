import type { CustomConfig } from '../types'

const docReaction: CustomConfig['docReaction'] = {
  feedbackMsg: 'このドキュメントは役立ちましたか？',
  good: '役立つ',
  bad: '役に立たない',
  feedbackFailMsg:
    'フィードバックが失敗しました。再試行するか、管理者に連絡してください（QQ：1961266616）！',
  feedbackSuccessMsg:
    'フィードバックが正常に送信されました。ありがとうございます！',
  badFeedbackSuccessMsg: '以下の問題を具体的にお知らせください~',
  form: {
    chooseIssues: '以下の問題に遭遇しましたか？',
    translationIssue: '翻訳の問題',
    typosIssue: '誤字/句読点のエラー',
    contentImgLinkIssue:
      '不正確なコンテンツ表現、画像読み込みエラー、またはリンクエラー',
    feedbackDetail: '詳細/提案',
    feedbackTip: 'ここに遭遇した問題や提案を説明してください',
    otherIssue: 'その他の問題（以下で具体的に指定してください）',
    contactWay: '連絡先（任意）',
    issueOptions: [
      { label: 'ページ表示エラー', value: 'pagedisplay-issue' },
      { label: '誤字、句読点のエラー', value: 'typos-issue' },
      { label: 'コンテンツ、画像、リンクのエラー', value: 'content-issue' },
      { label: 'その他の問題', value: 'other-issue' },
    ],
  },
}

export default docReaction
