import type { CustomConfig } from '../types'

const docReaction: CustomConfig['docReaction'] = {
  feedbackMsg: 'Was this document helpful?',
  good: 'Yes',
  bad: 'No',
  feedbackFailMsg:
    'Feedback failed, please retry or contact admin (QQ: 1961266616)!',
  feedbackSuccessMsg: 'Feedback submitted successfully, thank you!',
  badFeedbackSuccessMsg: 'Please specify any issues below~',
  form: {
    chooseIssues: 'Did you encounter these issues?',
    translationIssue: 'Translation',
    typosIssue: 'Typos/Punctuation',
    contentImgLinkIssue: 'Inaccurate Content, Image or Link',
    feedbackDetail: 'Details/Suggestions',
    feedbackTip: 'Describe issues or suggestions here',
    otherIssue: 'Other (specify below)',
    contactWay: 'Contact (optional)',
    issueOptions: [
      { label: 'Page Display Error', value: 'pagedisplay-issue' },
      { label: 'Typos, Punctuation', value: 'typos-issue' },
      { label: 'Content, Image, Link Error', value: 'content-issue' },
      { label: 'Other Issues', value: 'other-issue' },
    ],
  },
}

export default docReaction
