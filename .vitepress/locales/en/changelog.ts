import type { CustomConfig } from '../types'

const Changelog: CustomConfig['changelog'] = {
  title: 'Changelog',
  reportIssues: 'Report issues on %feedback.',
  feedbackPage: 'Feedback',
  changeType: {
    features: 'Features',
    fixed: 'Fixes',
    breaking: 'Breaking Changes',
    optimized: 'Optimized',
  },
  action: {
    download: 'Download',
    community: 'Join Community',
  },
}

export default Changelog
