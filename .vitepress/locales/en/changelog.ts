import type { CustomConfig } from '../types.ts'

const Changelog: CustomConfig['changelog'] = {
  title: 'Changelog',
  reportIssues: 'Report issues on %feedback.',
  feedbackPage: 'Feedback',
  changeType: {
    features: 'Features',
    fixed: 'Fixes',
    breaking: 'Breaking changes',
    optimized: 'Optimized',
  },
  action: {
    download: 'Download',
    community: 'Join community',
  },
}

export default Changelog
