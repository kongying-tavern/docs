const docReaction = {
  feedbackMsg: '本页对你有帮助吗？',
  good: '有帮助',
  bad: '无帮助',
  feedbackFailMsg: '反馈失败，请重试或联系管理员（QQ：1961266616）',
  feedbackSuccessMsg: '提交成功，感谢你的反馈！',
  badFeedbackSuccessMsg: '希望你能在下方告知我们具体问题~',
  loadingMsg: '加载中…',
  errorMessage: '错误信息：',
  viewFeedback: '查看反馈 #{id}',
  form: {
    chooseIssues: '是否遇到以下问题？',
    feedbackDetail: '反馈内容/更多建议',
    feedbackTip: '请详细描述你在使用文档过程中遇到的问题或优化建议',
    issueOptions: [
      { label: '页面显示错误', value: 'CATA-DISPLAY' },
      { label: '错别字、标点符号错误', value: 'CATA-TYPOS' },
      { label: '内容表达有误、图片/文字链接错误', value: 'CATA-DOCS' },
      { label: '其他问题', value: 'CATA-OTHER' },
    ],
  },
}

export default docReaction
