import type { CustomConfig } from '../types.ts'

const docReaction: CustomConfig['docReaction'] = {
  feedbackMsg: 'Was this document helpful?',
  good: 'Yes',
  bad: 'No',
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
      { label: 'Page Display Error', value: 'CATA-DISPLAY' },
      { label: 'Typos, Punctuation', value: 'CATA-TYPOS' },
      { label: 'Content, Image, Link Error', value: 'CATA-DOCS' },
      { label: 'Other Issues', value: 'CATA-OTHER' },
    ],
  },
}

export default docReaction
