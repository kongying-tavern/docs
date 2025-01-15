import type { CustomConfig } from '../types'

const Changelog: CustomConfig['changelog'] = {
  title: '更新履歴',
  reportIssues: '問題は%feedbackで報告してください。',
  feedbackPage: 'フィードバック',
  changeType: {
    features: '新機能',
    fixed: '修正',
    breaking: '重大な変更',
    optimized: '最適化された',
  },
  action: {
    download: 'ダウンロード',
    community: 'コミュニティ参加',
  },
}

export default Changelog
