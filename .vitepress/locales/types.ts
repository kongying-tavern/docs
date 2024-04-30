interface Info {
  title: string
  desc?: string
}

export interface CustomConfig {
  keyword: string
  description: string
  image: string
  footer: {
    qrcodeTitle: string
    qrcodeMessage: string
    qrcodeLink: string
    navigation: {
      title: string
      items: {
        text: string
        link: string
      }[]
    }[]
  }
  staff: {
    title: string
    desc: string
    clientStaff: Info
    webStaff: Info
    pinStaff: Info
    translateStaff: Info
    communityStaff: Info
  }
  team: {
    title: string
    desc: string
    coreMember: Info
    emeritiMember: Info
    partnerMember: Info
  }
  asideLinks: {
    title: string
    starOnGitHub: string
    contactUsText: string
    contactUsLink: string
    sponsor: string
    editLink: string
  }
  payment?: Record<
    string,
    {
      name: string
      address: string
    }
  >
  ui: {
    banner: {
      wip: string
    }
    button: {
      submit: string
      cancel: string
    }
  }
  docsFeedback: {
    feedbackMsg: string
    good: string
    bad: string
    badFeedbackSuccessMsg: string
    feedbackFailMsg: string
    feedbackSuccessMsg: string
    form: {
      chooseIssues: string
      translationIssue: string
      typosIssue: string
      ContentImgLinkIssue: string
      feedbackDetail: string
      feedbackTip: string
      otherIssue: string
      contactWay: string
      issueOptions: {
        label: string
        value: string
      }[]
    }
  }
}

export interface CustomConstant {
  META_URL: string
  META_TITLE: string
  META_KEYWORDS: string
  META_DESCRIPTION: string
  META_IMAGE: string
  LOCAL_CODE: string
  LOCAL_BASE: string
}
