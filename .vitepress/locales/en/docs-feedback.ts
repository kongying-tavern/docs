import type { CustomConfig } from '../types.ts'

const docReaction: CustomConfig['docReaction'] = {
  feedbackMsg: 'Was this document helpful?',
  good: 'Helpful',
  bad: 'Not helpful',
  feedbackFailMsg:
    'Feedback failed. Please retry or contact the admin (QQ: 1961266616).',
  feedbackSuccessMsg: 'Feedback submitted successfully, thank you!',
  badFeedbackSuccessMsg: 'Please specify any issues below~',
  loadingMsg: 'Loading…',
  errorMessage: 'Error message: ',
  viewFeedback: 'View feedback #{id}',
  form: {
    chooseIssues: 'Did you encounter these issues?',
    feedbackDetail: 'Details/Suggestions',
    feedbackTip: 'Describe issues or suggestions here',
    issueOptions: [
      { label: 'Page display error', value: 'CATA-DISPLAY' },
      { label: 'Typos and punctuation', value: 'CATA-TYPOS' },
      { label: 'Content, image, and link errors', value: 'CATA-DOCS' },
      { label: 'Other issues', value: 'CATA-OTHER' },
    ],
  },
}

export default docReaction
