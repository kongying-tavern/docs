import type { CustomConfig } from '../types'

const Changelog: CustomConfig['changelog'] = {
  title: '更新日志',
  reportIssues: '如果您遇到任何问题，请在 %feedback 上提交报告。',
  feedbackPage: '反馈页面',
  changeType: {
    features: '新增功能',
    fixed: '修复问题',
    breaking: '重大变更',
    optimized: '体验优化',
  },
  action: {
    download: '下载客户端',
    community: '加入社区',
  },
}

export default Changelog
